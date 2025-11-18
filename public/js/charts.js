/**
 * Charts Module - Handles all chart rendering and animations
 * Uses Canvas API for custom chart implementations
 */

import { formatCurrency, formatDate } from './utils.js';

/**
 * Chart configuration
 */
const chartConfig = {
  colors: {
    primary: '#6A0DAD',
    primaryLight: '#8B2FCE',
    secondary: '#FF6B6B',
    accent: '#4ECDC4',
    success: '#51CF66',
    warning: '#FFD93D',
    gray: '#6C757D'
  },
  animations: {
    duration: 1000,
    easing: 'easeOutQuart'
  }
};

/**
 * Draw income chart (line chart with area fill)
 */
export function drawIncomeChart(canvasId, data) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  
  // Set canvas size for high DPI displays
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  
  // Clear canvas
  ctx.clearRect(0, 0, rect.width, rect.height);
  
  if (!data || data.length === 0) {
    drawEmptyState(ctx, rect, 'No income data available');
    return;
  }
  
  // Process data
  const processedData = processIncomeData(data);
  
  // Draw chart
  drawLineChart(ctx, rect, processedData, {
    color: chartConfig.colors.primary,
    fillColor: chartConfig.colors.primaryLight,
    title: 'Income Trend',
    showGrid: true,
    showDots: true,
    animate: true
  });
}

/**
 * Draw tax chart (pie chart)
 */
export function drawTaxChart(canvasId, taxData) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  
  // Set canvas size for high DPI displays
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  
  // Clear canvas
  ctx.clearRect(0, 0, rect.width, rect.height);
  
  if (!taxData) {
    drawEmptyState(ctx, rect, 'No tax data available');
    return;
  }
  
  // Process tax data for pie chart
  const pieData = processTaxData(taxData);
  
  // Draw pie chart
  drawPieChart(ctx, rect, pieData, {
    title: 'Tax Breakdown',
    showLegend: true,
    animate: true
  });
}

/**
 * Process income data for chart
 */
function processIncomeData(data) {
  // Group by month
  const monthlyData = {};
  
  data.forEach(item => {
    const date = new Date(item.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthKey,
        income: 0,
        count: 0
      };
    }
    
    monthlyData[monthKey].income += item.netAmount || 0;
    monthlyData[monthKey].count += 1;
  });
  
  // Convert to array and sort
  return Object.values(monthlyData)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6); // Last 6 months
}

/**
 * Process tax data for pie chart
 */
function processTaxData(taxData) {
  const data = [];
  
  if (taxData.slabs && taxData.slabs.length > 0) {
    taxData.slabs.forEach(slab => {
      if (slab.amount > 0) {
        data.push({
          label: slab.range,
          value: slab.amount,
          color: getTaxSlabColor(slab.rate)
        });
      }
    });
  }
  
  return data;
}

/**
 * Get color for tax slab based on rate
 */
function getTaxSlabColor(rate) {
  const colors = {
    '0%': chartConfig.colors.success,
    '5%': chartConfig.colors.accent,
    '10%': chartConfig.colors.warning,
    '15%': chartConfig.colors.secondary,
    '20%': '#FF8C42',
    '25%': '#FF6B35',
    '30%': chartConfig.colors.primary
  };
  
  return colors[rate] || chartConfig.colors.gray;
}

/**
 * Draw line chart
 */
function drawLineChart(ctx, rect, data, options) {
  const { width, height } = rect;
  const padding = { top: 40, right: 20, bottom: 60, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // Calculate scales
  const maxValue = Math.max(...data.map(d => d.income));
  const xScale = chartWidth / (data.length - 1);
  const yScale = chartHeight / maxValue;
  
  // Draw grid
  if (options.showGrid) {
    drawGrid(ctx, padding, chartWidth, chartHeight, maxValue);
  }
  
  // Draw axes
  drawAxes(ctx, padding, chartWidth, chartHeight);
  
  // Draw labels
  drawLabels(ctx, padding, chartWidth, chartHeight, data, maxValue);
  
  // Draw title
  if (options.title) {
    drawTitle(ctx, width, options.title);
  }
  
  // Create gradient for area fill
  const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
  gradient.addColorStop(0, options.fillColor + '40');
  gradient.addColorStop(1, options.fillColor + '10');
  
  // Draw area
  ctx.beginPath();
  ctx.moveTo(padding.left, height - padding.bottom);
  
  data.forEach((point, index) => {
    const x = padding.left + index * xScale;
    const y = height - padding.bottom - (point.income * yScale);
    
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  
  ctx.lineTo(padding.left + (data.length - 1) * xScale, height - padding.bottom);
  ctx.lineTo(padding.left, height - padding.bottom);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Draw line
  ctx.beginPath();
  ctx.strokeStyle = options.color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  data.forEach((point, index) => {
    const x = padding.left + index * xScale;
    const y = height - padding.bottom - (point.income * yScale);
    
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  
  ctx.stroke();
  
  // Draw dots
  if (options.showDots) {
    data.forEach((point, index) => {
      const x = padding.left + index * xScale;
      const y = height - padding.bottom - (point.income * yScale);
      
      // Outer circle
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = options.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Inner circle
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = options.color;
      ctx.fill();
    });
  }
}

/**
 * Draw pie chart
 */
function drawPieChart(ctx, rect, data, options) {
  const { width, height } = rect;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 3;
  
  // Calculate total
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Draw title
  if (options.title) {
    drawTitle(ctx, width, options.title);
  }
  
  // Draw pie slices
  let currentAngle = -Math.PI / 2; // Start from top
  
  data.forEach((item, index) => {
    const sliceAngle = (item.value / total) * Math.PI * 2;
    
    // Draw slice
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = item.color;
    ctx.fill();
    
    // Draw border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw label
    const labelAngle = currentAngle + sliceAngle / 2;
    const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
    const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const percentage = ((item.value / total) * 100).toFixed(1);
    ctx.fillText(`${percentage}%`, labelX, labelY);
    
    currentAngle += sliceAngle;
  });
  
  // Draw legend
  if (options.showLegend) {
    drawLegend(ctx, rect, data);
  }
}

/**
 * Draw grid
 */
function drawGrid(ctx, padding, width, height, maxValue) {
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 2]);
  
  // Horizontal grid lines
  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const y = padding.top + (height / gridLines) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + width, y);
    ctx.stroke();
  }
  
  ctx.setLineDash([]);
}

/**
 * Draw axes
 */
function drawAxes(ctx, padding, width, height) {
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 2;
  
  // Y-axis
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, padding.top + height);
  ctx.stroke();
  
  // X-axis
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top + height);
  ctx.lineTo(padding.left + width, padding.top + height);
  ctx.stroke();
}

/**
 * Draw labels
 */
function drawLabels(ctx, padding, width, height, data, maxValue) {
  ctx.fillStyle = '#6B7280';
  ctx.font = '12px Inter';
  
  // Y-axis labels
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  
  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const value = (maxValue / gridLines) * (gridLines - i);
    const y = padding.top + (height / gridLines) * i;
    ctx.fillText(formatCurrency(value), padding.left - 10, y);
  }
  
  // X-axis labels
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  
  data.forEach((point, index) => {
    const x = padding.left + (width / (data.length - 1)) * index;
    const y = padding.top + height + 10;
    
    // Format month label
    const [year, month] = point.month.split('-');
    const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short' });
    ctx.fillText(monthName, x, y);
  });
}

/**
 * Draw title
 */
function drawTitle(ctx, width, title) {
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 16px Inter';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(title, width / 2, 10);
}

/**
 * Draw legend
 */
function drawLegend(ctx, rect, data) {
  const legendX = 20;
  let legendY = rect.height - data.length * 25 - 20;
  
  ctx.font = '12px Inter';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  
  data.forEach((item, index) => {
    // Color box
    ctx.fillStyle = item.color;
    ctx.fillRect(legendX, legendY + index * 25, 15, 15);
    
    // Label
    ctx.fillStyle = '#374151';
    ctx.fillText(item.label, legendX + 20, legendY + index * 25 + 7.5);
  });
}

/**
 * Draw empty state
 */
function drawEmptyState(ctx, rect, message) {
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  
  // Draw icon
  ctx.font = '48px Inter';
  ctx.fillStyle = '#9CA3AF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('📊', centerX, centerY - 20);
  
  // Draw message
  ctx.font = '14px Inter';
  ctx.fillStyle = '#6B7280';
  ctx.fillText(message, centerX, centerY + 20);
}

/**
 * Animate chart drawing
 */
function animateChart(drawFunction, duration = 1000) {
  const startTime = performance.now();
  
  function draw(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    
    // Draw with progress
    drawFunction(easeOutQuart);
    
    if (progress < 1) {
      requestAnimationFrame(draw);
    }
  }
  
  requestAnimationFrame(draw);
}

/**
 * Create bar chart
 */
export function drawBarChart(canvasId, data, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  
  // Set canvas size for high DPI displays
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  
  // Clear canvas
  ctx.clearRect(0, 0, rect.width, rect.height);
  
  if (!data || data.length === 0) {
    drawEmptyState(ctx, rect, 'No data available');
    return;
  }
  
  const { width, height } = rect;
  const padding = { top: 40, right: 20, bottom: 60, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // Calculate scales
  const maxValue = Math.max(...data.map(d => d.value));
  const barWidth = chartWidth / data.length * 0.6;
  const barSpacing = chartWidth / data.length * 0.4;
  const yScale = chartHeight / maxValue;
  
  // Draw grid and axes
  drawGrid(ctx, padding, chartWidth, chartHeight, maxValue);
  drawAxes(ctx, padding, chartWidth, chartHeight);
  
  // Draw title
  if (options.title) {
    drawTitle(ctx, width, options.title);
  }
  
  // Draw bars with animation
  data.forEach((item, index) => {
    const x = padding.left + index * (barWidth + barSpacing) + barSpacing / 2;
    const barHeight = item.value * yScale;
    const y = height - padding.bottom - barHeight;
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, y, 0, height - padding.bottom);
    gradient.addColorStop(0, options.color || chartConfig.colors.primary);
    gradient.addColorStop(1, options.colorLight || chartConfig.colors.primaryLight);
    
    // Draw bar
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth, barHeight);
    
    // Draw value on top
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 12px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(formatCurrency(item.value), x + barWidth / 2, y - 5);
    
    // Draw label
    ctx.fillStyle = '#6B7280';
    ctx.font = '11px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(item.label, x + barWidth / 2, height - padding.bottom + 10);
  });
}

/**
 * Resize handler for charts
 */
export function resizeCharts() {
  // Re-draw all charts when window is resized
  const charts = document.querySelectorAll('canvas');
  charts.forEach(canvas => {
    const event = new CustomEvent('chartResize', { detail: { canvas } });
    canvas.dispatchEvent(event);
  });
}

// Add resize listener with debounce
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(resizeCharts, 250);
});

/**
 * Export chart as image
 */
export function exportChart(canvasId, filename) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
}
