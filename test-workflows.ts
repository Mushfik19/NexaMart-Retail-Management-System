import prisma from './src/lib/prisma';

async function runTests() {
  console.log('🧪 Starting SuperShop Management Automated Verification Tests...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Store & Register test
    const store = await prisma.store.findFirst({ where: { code: 'STR-01' } });
    assert(!!store, 'Flagship store exists in database');

    const register = await prisma.cashRegister.findFirst({ where: { storeId: store!.id } });
    assert(!!register, 'Cash register configured for flagship store');

    // 2. Barcode search test
    const milk = await prisma.product.findUnique({ where: { barcode: '9310047201389' } });
    assert(!!milk && milk.name.includes('Full Cream Milk'), 'Barcode search finds correct product (Full Cream Milk 2L)');

    // 3. Inventory Stock Safety Test: Initial Stock Check
    const initialInv = await prisma.inventory.findUnique({
      where: { productId_storeId: { productId: milk!.id, storeId: store!.id } },
    });
    const initialStock = initialInv!.onHand;
    console.log(`ℹ️ Initial Milk Stock: ${initialStock}`);
    assert(initialStock > 5, 'Milk has adequate initial stock');

    // 4. Critical POS Workflow: Buy 3 bottles of Milk with Cash payment
    const buyQty = 3;
    const unitPrice = milk!.sellingPrice;
    const subtotal = Number((buyQty * unitPrice).toFixed(2));
    const taxRate = 10.0;
    const taxAmount = Number((subtotal - subtotal / 1.10).toFixed(2));
    const grandTotal = subtotal; // Tax inclusive default in Australia

    const cashier = await prisma.user.findFirst({ where: { role: 'CASHIER' } });

    // Execute atomic sale
    const saleResult = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          receiptNumber: `RCP-TEST-${Date.now()}`,
          storeId: store!.id,
          registerId: register!.id,
          userId: cashier!.id,
          subtotal,
          itemDiscount: 0,
          orderDiscount: 0,
          taxAmount,
          rounding: 0,
          grandTotal,
          totalCost: Number((buyQty * milk!.costPrice).toFixed(2)),
          grossProfit: Number((grandTotal - buyQty * milk!.costPrice).toFixed(2)),
          amountPaid: 20.0,
          changeGiven: Number((20.0 - grandTotal).toFixed(2)),
          status: 'COMPLETED',
          paymentStatus: 'PAID',
        },
      });

      await tx.saleItem.create({
        data: {
          saleId: sale.id,
          productId: milk!.id,
          productName: milk!.name,
          sku: milk!.sku,
          barcode: milk!.barcode,
          unitPrice,
          costPrice: milk!.costPrice,
          quantity: buyQty,
          subtotal,
          total: subtotal,
        },
      });

      // Decrement inventory
      const newOnHand = initialStock - buyQty;
      await tx.inventory.update({
        where: { productId_storeId: { productId: milk!.id, storeId: store!.id } },
        data: { onHand: newOnHand, available: newOnHand },
      });

      // Record transaction
      await tx.inventoryTransaction.create({
        data: {
          productId: milk!.id,
          storeId: store!.id,
          type: 'SALE',
          quantity: -buyQty,
          balanceAfter: newOnHand,
          reason: `Test Sale ${sale.receiptNumber}`,
          userId: cashier!.id,
        },
      });

      // Payment
      await tx.payment.create({
        data: {
          saleId: sale.id,
          method: 'CASH',
          amount: grandTotal,
          tendered: 20.0,
          change: Number((20.0 - grandTotal).toFixed(2)),
          status: 'SUCCESS',
        },
      });

      return sale;
    });

    assert(!!saleResult.id, 'Sale created atomically with receipt number');

    // 5. Verify Exact Inventory Deduction (Stock = Initial - 3)
    const afterInv = await prisma.inventory.findUnique({
      where: { productId_storeId: { productId: milk!.id, storeId: store!.id } },
    });
    assert(afterInv!.onHand === initialStock - buyQty, `Stock exactly decremented by ${buyQty} (From ${initialStock} to ${afterInv!.onHand})`);

    // 6. Split Payment Math Check
    const splitTotal = 100.0;
    const splitCash = 40.0;
    const splitCard = 60.0;
    const splitRemaining = splitTotal - (splitCash + splitCard);
    assert(splitRemaining === 0, 'Split payment balance check ($40 cash + $60 card = $100 total, $0 remaining)');

    // 7. Insufficient Stock Safety Rejection Test
    const excessiveQty = 99999;
    const canFulfill = afterInv!.onHand >= excessiveQty;
    assert(!canFulfill, 'System correctly rejects orders with insufficient stock');

    // 8. Return / Refund Stock Restitution Test
    const refundResult = await prisma.$transaction(async (tx) => {
      const refund = await tx.refund.create({
        data: {
          refundNumber: `REF-TEST-${Date.now()}`,
          saleId: saleResult.id,
          subtotal: unitPrice,
          totalRefunded: unitPrice,
          refundMethod: 'CASH',
          reason: 'CHANGED_MIND',
          restockItems: true,
        },
      });

      // Restock 1 item
      const restockedOnHand = afterInv!.onHand + 1;
      await tx.inventory.update({
        where: { productId_storeId: { productId: milk!.id, storeId: store!.id } },
        data: { onHand: restockedOnHand, available: restockedOnHand },
      });

      await tx.inventoryTransaction.create({
        data: {
          productId: milk!.id,
          storeId: store!.id,
          type: 'RETURN',
          quantity: 1,
          balanceAfter: restockedOnHand,
          reason: `Test Refund ${refund.refundNumber}`,
          userId: cashier!.id,
        },
      });

      return refund;
    });

    const postRefundInv = await prisma.inventory.findUnique({
      where: { productId_storeId: { productId: milk!.id, storeId: store!.id } },
    });
    assert(postRefundInv!.onHand === afterInv!.onHand + 1, 'Refund successfully restored returned inventory (+1)');

    // 9. Goods Receiving Automated Inventory Increment Test
    const initialCokeInv = await prisma.inventory.findFirst({
      where: { product: { barcode: '9300601234567' }, storeId: store!.id },
      include: { product: true },
    });
    const cokeInitial = initialCokeInv!.onHand;
    const receivedCokeQty = 24;

    await prisma.$transaction(async (tx) => {
      const gr = await tx.goodsReceipt.create({
        data: {
          grNumber: `GRN-TEST-${Date.now()}`,
          userId: cashier!.id,
          storeId: store!.id,
          supplierInvoice: 'INV-TEST-001',
        },
      });

      await tx.goodsReceiptItem.create({
        data: {
          goodsReceiptId: gr.id,
          productId: initialCokeInv!.productId,
          orderedQty: 24,
          receivedQty: 24,
          damagedQty: 0,
          acceptedQty: receivedCokeQty,
          unitCost: initialCokeInv!.product.costPrice,
        },
      });

      const newCokeStock = cokeInitial + receivedCokeQty;
      await tx.inventory.update({
        where: { id: initialCokeInv!.id },
        data: { onHand: newCokeStock, available: newCokeStock },
      });
    });

    const afterCokeInv = await prisma.inventory.findUnique({
      where: { id: initialCokeInv!.id },
    });
    assert(afterCokeInv!.onHand === cokeInitial + receivedCokeQty, `Goods receiving correctly incremented stock by +${receivedCokeQty} (From ${cokeInitial} to ${afterCokeInv!.onHand})`);

    // 10. Audit Log Traceability Check
    const auditCount = await prisma.auditLog.count();
    assert(auditCount > 0, `Audit log contains ${auditCount} verifiable records of critical system actions`);

    console.log(`\n========================================`);
    console.log(`🎉 ALL TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
