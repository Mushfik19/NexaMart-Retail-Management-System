import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const userOrRes = await requirePermission(req, 'reports');
    if (userOrRes instanceof Response) return userOrRes;
    
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');
    const range = searchParams.get('range') || 'today'; // 'today', 'yesterday', 'week', 'month', 'all'
    const exportFormat = searchParams.get('export'); // 'csv'

    const now = new Date();
    let startDate: Date;

    if (range === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === 'yesterday') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    } else if (range === 'week') {
      startDate = new Date(now.getTime() - 7 * 86400000);
    } else if (range === 'month') {
      startDate = new Date(now.getTime() - 30 * 86400000);
    } else {
      startDate = new Date(0); // all
    }

    const whereSale: any = {
      createdAt: { gte: startDate },
      status: 'COMPLETED',
      ...(storeId ? { storeId } : {}),
    };

    // Sales in date range
    const sales = await prisma.sale.findMany({
      where: whereSale,
      include: {
        items: true,
        payments: true,
        customer: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    let totalRevenue = 0;
    let totalCogs = 0;
    let totalGrossProfit = 0;
    let totalDiscounts = 0;
    let totalTax = 0;

    // Payment distribution
    const paymentMethods: Record<string, number> = {
      CASH: 0,
      CREDIT_CARD: 0,
      DEBIT_CARD: 0,
      MOBILE_PAYMENT: 0,
      SPLIT: 0,
    };

    // Product sales map
    const productSalesMap: Record<string, { name: string; quantity: number; revenue: number }> = {};

    for (const s of sales) {
      totalRevenue += s.grandTotal;
      totalCogs += s.totalCost;
      totalGrossProfit += s.grossProfit;
      totalDiscounts += s.itemDiscount + s.orderDiscount;
      totalTax += s.taxAmount;

      if (s.payments.length > 1) {
        paymentMethods['SPLIT'] = (paymentMethods['SPLIT'] || 0) + s.grandTotal;
      } else if (s.payments[0]) {
        const m = s.payments[0].method;
        paymentMethods[m] = (paymentMethods[m] || 0) + s.payments[0].amount;
      }

      for (const item of s.items) {
        if (!productSalesMap[item.productId]) {
          productSalesMap[item.productId] = { name: item.productName, quantity: 0, revenue: 0 };
        }
        productSalesMap[item.productId].quantity += item.quantity;
        productSalesMap[item.productId].revenue += item.subtotal;
      }
    }

    // Top 10 selling products
    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Expenses in range
    const expenses = await prisma.expense.findMany({
      where: {
        createdAt: { gte: startDate },
        ...(storeId ? { storeId } : {}),
      },
    });
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

    // Net estimated profit
    const netProfit = totalGrossProfit - totalExpenses;

    // Inventory metrics
    const inventory = await prisma.inventory.findMany({
      where: storeId ? { storeId } : {},
      include: { product: true },
    });

    let inventoryValuationCost = 0;
    let inventoryValuationRetail = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const inv of inventory) {
      inventoryValuationCost += inv.onHand * inv.product.costPrice;
      inventoryValuationRetail += inv.onHand * inv.product.sellingPrice;
      if (inv.onHand === 0) outOfStockCount++;
      else if (inv.onHand <= inv.reorderPoint) lowStockCount++;
    }

    // Pending POs
    const pendingPOs = await prisma.purchaseOrder.count({
      where: {
        status: { in: ['PENDING', 'ORDERED'] },
        ...(storeId ? { storeId } : {}),
      },
    });

    // Handle CSV Export
    if (exportFormat === 'csv') {
      let csvContent = 'Receipt Number,Date,Customer,Total,COGS,Gross Profit,Payment Method\n';
      for (const s of sales) {
        const method = s.payments.map((p) => p.method).join(' + ') || 'CASH';
        const cust = s.customer ? s.customer.name.replace(/,/g, ' ') : 'Walk-in';
        csvContent += `${s.receiptNumber},${s.createdAt.toISOString().slice(0, 19)},${cust},${s.grandTotal},${s.totalCost},${s.grossProfit},${method}\n`;
      }

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="sales-report-${range}.csv"`,
        },
      });
    }

    // Daily breakdown for charts
    const dailyMap: Record<string, { date: string; sales: number; profit: number; transactions: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      dailyMap[key] = { date: key, sales: 0, profit: 0, transactions: 0 };
    }

    for (const s of sales) {
      const key = s.createdAt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      if (dailyMap[key]) {
        dailyMap[key].sales += s.grandTotal;
        dailyMap[key].profit += s.grossProfit;
        dailyMap[key].transactions += 1;
      }
    }

    const salesTrend = Object.values(dailyMap);

    return NextResponse.json({
      summary: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalCogs: Number(totalCogs.toFixed(2)),
        grossProfit: Number(totalGrossProfit.toFixed(2)),
        totalExpenses: Number(totalExpenses.toFixed(2)),
        netProfit: Number(netProfit.toFixed(2)),
        profitMargin: totalRevenue > 0 ? Number(((totalGrossProfit / totalRevenue) * 100).toFixed(1)) : 0,
        totalDiscounts: Number(totalDiscounts.toFixed(2)),
        totalTax: Number(totalTax.toFixed(2)),
        transactionsCount: sales.length,
        averageOrderValue: sales.length > 0 ? Number((totalRevenue / sales.length).toFixed(2)) : 0,
        inventoryValuationCost: Number(inventoryValuationCost.toFixed(2)),
        inventoryValuationRetail: Number(inventoryValuationRetail.toFixed(2)),
        lowStockCount,
        outOfStockCount,
        pendingPOs,
      },
      salesTrend,
      topProducts,
      paymentMethods: Object.entries(paymentMethods).map(([name, value]) => ({
        name,
        value: Number(value.toFixed(2)),
      })),
    });
  } catch (error: any) {
    console.error('Reports error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
