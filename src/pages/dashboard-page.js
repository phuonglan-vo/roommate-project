import Chart from 'chart.js/auto';

import '../styles/dashboard.css';

import reportService
  from '../services/report-service.js';

import {
  createStatCard
} from '../components/stat-card.js';

import {
  createAlertList
} from '../components/alert-list.js';

const CURRENCY_FORMATTER =
  new Intl.NumberFormat(
    'vi-VN',
    {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }
  );

const NUMBER_FORMATTER =
  new Intl.NumberFormat(
    'vi-VN',
    {
      maximumFractionDigits: 2
    }
  );

function createElement(
  tagName,
  {
    className = '',
    text = null,
    attributes = {},
    dataset = {}
  } = {},
  children = []
) {
  const element =
    document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (text !== null) {
    element.textContent = text;
  }

  Object.entries(attributes).forEach(
    ([name, value]) => {
      if (
        value !== undefined &&
        value !== null
      ) {
        element.setAttribute(
          name,
          String(value)
        );
      }
    }
  );

  Object.entries(dataset).forEach(
    ([name, value]) => {
      element.dataset[name] =
        String(value);
    }
  );

  element.append(...children);

  return element;
}

function formatCurrency(value) {
  const numericValue = Number(value);

  return CURRENCY_FORMATTER.format(
    Number.isFinite(numericValue)
      ? numericValue
      : 0
  );
}

function formatNumber(value) {
  const numericValue = Number(value);

  return NUMBER_FORMATTER.format(
    Number.isFinite(numericValue)
      ? numericValue
      : 0
  );
}

function getCurrentMonthInVietnam() {
  const parts =
    new Intl.DateTimeFormat(
      'en-CA',
      {
        timeZone:
          'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit'
      }
    ).formatToParts(new Date());

  const values =
    Object.fromEntries(
      parts
        .filter(
          (part) =>
            part.type !== 'literal'
        )
        .map(
          (part) => [
            part.type,
            part.value
          ]
        )
    );

  return (
    `${values.year}-` +
    `${values.month}`
  );
}

function getCurrentDateInVietnam() {
  const parts =
    new Intl.DateTimeFormat(
      'en-CA',
      {
        timeZone:
          'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }
    ).formatToParts(new Date());

  const values =
    Object.fromEntries(
      parts
        .filter(
          (part) =>
            part.type !== 'literal'
        )
        .map(
          (part) => [
            part.type,
            part.value
          ]
        )
    );

  return (
    `${values.year}-` +
    `${values.month}-` +
    `${values.day}`
  );
}

/**
 * Chỉ chọn bản ghi đã được ReportService tổng hợp.
 * Trang không tự cộng hoặc tính lại số liệu nghiệp vụ.
 */
function findMonthRecord(
  records,
  month
) {
  return (
    records.find(
      (record) =>
        record.month === month
    ) ?? null
  );
}

function createChartCard({
  title,
  description,
  testId
}) {
  const canvas = createElement('canvas', {
    attributes: {
      role: 'img',
      'aria-label': title
    },

    dataset: {
      testid:
        `${testId}-canvas`
    }
  });

  const canvasWrapper =
    createElement(
      'div',
      {
        className:
          'rm-dashboard-chart__canvas',

        dataset: {
          testid:
            `${testId}-content`
        }
      },
      [canvas]
    );

  const emptyState =
    createElement(
      'div',
      {
        className:
          'rm-dashboard-chart__empty',

        attributes: {
          hidden: ''
        },

        dataset: {
          testid:
            `${testId}-empty`
        }
      },
      [
        createElement('span', {
          className:
            'rm-dashboard-chart__empty-icon',

          text: '▥',

          attributes: {
            'aria-hidden': 'true'
          }
        }),

        createElement('p', {
          className: 'mb-0',
          text:
            'Chưa có dữ liệu để hiển thị biểu đồ.'
        })
      ]
    );

  const element = createElement(
    'article',
    {
      className:
        'rm-dashboard-chart',

      dataset: {
        testid
      }
    },
    [
      createElement(
        'header',
        {
          className:
            'rm-dashboard-chart__header'
        },
        [
          createElement('div', {}, [
            createElement('h3', {
              text: title
            }),

            createElement('p', {
              text: description
            })
          ])
        ]
      ),

      canvasWrapper,
      emptyState
    ]
  );

  function setEmpty(empty) {
    canvasWrapper.hidden =
      Boolean(empty);

    emptyState.hidden =
      !empty;
  }

  return {
    element,
    canvas,
    setEmpty
  };
}

export function createDashboardPage() {
  let revenueChart = null;
  let roomStatusChart = null;

  const currentMonth =
    getCurrentMonthInVietnam();

  const currentDate =
    getCurrentDateInVietnam();

  const page = createElement('section', {
    className:
      'rm-dashboard-page',

    dataset: {
      testid:
        'dashboard-page'
    }
  });

  const refreshButton =
    createElement('button', {
      className:
        'btn btn-outline-primary',

      text: 'Làm mới',

      attributes: {
        type: 'button'
      },

      dataset: {
        testid:
          'dashboard-refresh-button'
      }
    });

  const heading = createElement(
    'div',
    {
      className:
        'rm-dashboard-heading'
    },
    [
      createElement('div', {}, [
        createElement('h2', {
          className: 'h4 mb-1',
          text: 'Tổng quan'
        }),

        createElement('p', {
          className:
            'mb-0 text-body-secondary',

          text:
            `Tình hình vận hành RoomMate tháng ${currentMonth}.`
        })
      ]),

      refreshButton
    ]
  );

  const statCards = {
    totalRooms: createStatCard({
      label: 'Tổng số phòng',
      icon: '▦',
      variant: 'primary',
      testId:
        'dashboard-total-rooms'
    }),

    vacantRooms: createStatCard({
      label: 'Phòng trống',
      icon: '□',
      variant: 'info',
      testId:
        'dashboard-vacant-rooms'
    }),

    occupiedRooms: createStatCard({
      label: 'Phòng đang thuê',
      icon: '■',
      variant: 'success',
      testId:
        'dashboard-occupied-rooms'
    }),

    occupancyRate: createStatCard({
      label: 'Tỷ lệ lấp đầy',
      icon: '%',
      variant: 'success',
      testId:
        'dashboard-occupancy-rate'
    }),

    currentTenants: createStatCard({
      label: 'Người thuê hiện tại',
      icon: '●',
      variant: 'primary',
      testId:
        'dashboard-current-tenants'
    }),

    monthlyRevenue: createStatCard({
      label: 'Doanh thu tháng',
      icon: '₫',
      variant: 'success',
      testId:
        'dashboard-monthly-revenue'
    }),

    totalDebt: createStatCard({
      label: 'Tổng công nợ',
      icon: '₫',
      variant: 'danger',
      testId:
        'dashboard-total-debt'
    }),

    overdueInvoices: createStatCard({
      label: 'Hóa đơn quá hạn',
      icon: '!',
      variant: 'danger',
      testId:
        'dashboard-overdue-invoices'
    }),

    monthlyElectricity:
      createStatCard({
        label:
          'Điện tiêu thụ tháng',

        icon: '⚡',
        variant: 'warning',

        testId:
          'dashboard-monthly-electricity'
      }),

    monthlyWater:
      createStatCard({
        label:
          'Nước tiêu thụ tháng',

        icon: '●',
        variant: 'info',

        testId:
          'dashboard-monthly-water'
      })
  };

  const statGrid = createElement(
    'div',
    {
      className:
        'rm-dashboard-stats',

      dataset: {
        testid:
          'dashboard-stat-grid'
      }
    },
    Object.values(statCards).map(
      (card) => card.element
    )
  );

  const revenueChartCard =
    createChartCard({
      title:
        'Doanh thu 6 tháng gần nhất',

      description:
        'So sánh tổng giá trị hóa đơn và số tiền thực thu.',

      testId:
        'dashboard-revenue-chart'
    });

  const roomStatusChartCard =
    createChartCard({
      title:
        'Trạng thái phòng',

      description:
        'Cơ cấu phòng trống, đang thuê, sửa chữa và trạng thái khác.',

      testId:
        'dashboard-room-status-chart'
    });

  const charts = createElement(
    'div',
    {
      className:
        'rm-dashboard-charts'
    },
    [
      revenueChartCard.element,
      roomStatusChartCard.element
    ]
  );

  const alertList =
    createAlertList();

  const errorState = createElement(
    'div',
    {
      className:
        'alert alert-danger',

      attributes: {
        hidden: '',
        role: 'alert'
      },

      dataset: {
        testid:
          'dashboard-error'
      }
    }
  );

  page.append(
    heading,
    errorState,
    statGrid,
    charts,
    alertList.element
  );

  function destroyCharts() {
    if (revenueChart) {
      revenueChart.destroy();
      revenueChart = null;
    }

    if (roomStatusChart) {
      roomStatusChart.destroy();
      roomStatusChart = null;
    }
  }

  function setLoading(loading) {
    Object.values(statCards)
      .forEach(
        (card) =>
          card.setLoading(loading)
      );

    alertList.setLoading(loading);

    refreshButton.disabled =
      loading;

    refreshButton.textContent =
      loading
        ? 'Đang tải...'
        : 'Làm mới';
  }

  function renderStatCards(
    reportData
  ) {
    const metrics =
      reportData.metrics;

    const monthlyRevenue =
      findMonthRecord(
        reportData.details
          .invoiceValueByMonth,
        currentMonth
      );

    const monthlyMeterUsage =
      findMonthRecord(
        reportData.details
          .meterUsageByMonth,
        currentMonth
      );

    statCards.totalRooms.setValue(
      formatNumber(
        metrics.totalRooms
      )
    );

    statCards.vacantRooms.setValue(
      formatNumber(
        metrics.vacantRooms
      )
    );

    statCards.occupiedRooms.setValue(
      formatNumber(
        metrics.occupiedRooms
      )
    );

    statCards.occupancyRate.setValue(
      `${formatNumber(
        metrics.occupancyRate
      )}%`
    );

    statCards.currentTenants.setValue(
      formatNumber(
        metrics.currentTenantCount
      )
    );

    statCards.monthlyRevenue.setValue(
      formatCurrency(
        monthlyRevenue
          ?.invoiceValue ?? 0
      )
    );

    statCards.monthlyRevenue
      .setDescription(
        monthlyRevenue
          ? `${monthlyRevenue.invoiceCount} hóa đơn`
          : 'Chưa có hóa đơn trong tháng'
      );

    statCards.totalDebt.setValue(
      formatCurrency(
        metrics.totalDebt
      )
    );

    statCards.overdueInvoices.setValue(
      formatNumber(
        metrics.overdueInvoiceCount
      )
    );

    statCards.monthlyElectricity
      .setValue(
        `${formatNumber(
          monthlyMeterUsage
            ?.electricityUsage ?? 0
        )} kWh`
      );

    statCards.monthlyWater
      .setValue(
        `${formatNumber(
          monthlyMeterUsage
            ?.waterUsage ?? 0
        )} m³`
      );
  }

  function renderAlerts(reportData) {
    const alerts = [];

    if (
      reportData.metrics
        .overdueInvoiceCount > 0
    ) {
      alerts.push({
        id: 'overdue-invoices',
        type: 'danger',

        title:
          `${reportData.metrics.overdueInvoiceCount} hóa đơn quá hạn`,

        message:
          `Tổng công nợ hiện tại là ${formatCurrency(
            reportData.metrics
              .totalDebt
          )}.`,

        href: '#/debts',
        linkLabel:
          'Xem công nợ'
      });
    }

    reportData.details
      .expiringContracts
      .forEach((contract) => {
        alerts.push({
          id:
            `contract-${contract.contractId}`,

          type:
            contract.daysRemaining <= 7
              ? 'danger'
              : 'warning',

          title:
            `Hợp đồng ${contract.contractCode} sắp hết hạn`,

          message:
            `Còn ${contract.daysRemaining} ngày, hết hạn ngày ${contract.endDate}.`,

          href:
            '#/contracts',

          linkLabel:
            'Xem hợp đồng'
        });
      });

    const missingMeterData =
      !findMonthRecord(
        reportData.details
          .meterUsageByMonth,
        currentMonth
      );

    if (missingMeterData) {
      alerts.push({
        id:
          'missing-meter-data',

        type: 'info',

        title:
          'Chưa có dữ liệu điện nước tháng này',

        message:
          `Chưa ghi nhận dữ liệu tiêu thụ cho tháng ${currentMonth}.`,

        href:
          '#/meters',

        linkLabel:
          'Ghi chỉ số'
      });
    }

    alertList.render(alerts);
  }

  function renderRevenueChart(
    reportData
  ) {
    if (revenueChart) {
      revenueChart.destroy();
      revenueChart = null;
    }

    const chartData =
      reportData.charts
        .monthlyRevenue;

    const labels =
      chartData.labels.slice(-6);

    const invoiceValues =
      chartData.invoiceValues.slice(-6);

    const collectedAmounts =
      chartData.collectedAmounts
        .slice(-6);

    const hasData =
      labels.length > 0;

    revenueChartCard.setEmpty(
      !hasData
    );

    if (!hasData) {
      return;
    }

    revenueChart = new Chart(
      revenueChartCard.canvas,
      {
        type: 'bar',

        data: {
          labels,

          datasets: [
            {
              label:
                'Tổng giá trị hóa đơn',

              data: invoiceValues,

              backgroundColor:
                'rgba(37, 99, 235, 0.72)',

              borderColor:
                'rgb(37, 99, 235)',

              borderWidth: 1,
              borderRadius: 5
            },

            {
              label:
                'Tiền thực thu',

              data:
                collectedAmounts,

              backgroundColor:
                'rgba(22, 163, 74, 0.72)',

              borderColor:
                'rgb(22, 163, 74)',

              borderWidth: 1,
              borderRadius: 5
            }
          ]
        },

        options: {
          responsive: true,
          maintainAspectRatio: false,

          interaction: {
            mode: 'index',
            intersect: false
          },

          plugins: {
            legend: {
              position: 'bottom'
            },

            tooltip: {
              callbacks: {
                label(context) {
                  return (
                    `${context.dataset.label}: ` +
                    `${formatCurrency(
                      context.raw
                    )}`
                  );
                }
              }
            }
          },

          scales: {
            y: {
              beginAtZero: true,

              ticks: {
                callback(value) {
                  return formatCurrency(
                    value
                  );
                }
              }
            },

            x: {
              grid: {
                display: false
              }
            }
          }
        }
      }
    );
  }

  function renderRoomStatusChart(
    reportData
  ) {
    if (roomStatusChart) {
      roomStatusChart.destroy();
      roomStatusChart = null;
    }

    const chartData =
      reportData.charts
        .roomStatus;

    const hasData =
      chartData.data.some(
        (value) =>
          Number(value) > 0
      );

    roomStatusChartCard.setEmpty(
      !hasData
    );

    if (!hasData) {
      return;
    }

    roomStatusChart = new Chart(
      roomStatusChartCard.canvas,
      {
        type: 'doughnut',

        data: {
          labels:
            chartData.labels,

          datasets: [
            {
              data:
                chartData.data,

              backgroundColor: [
                'rgba(14, 165, 233, 0.78)',
                'rgba(22, 163, 74, 0.78)',
                'rgba(245, 158, 11, 0.78)',
                'rgba(100, 116, 139, 0.78)'
              ],

              borderColor: [
                'rgb(14, 165, 233)',
                'rgb(22, 163, 74)',
                'rgb(245, 158, 11)',
                'rgb(100, 116, 139)'
              ],

              borderWidth: 1
            }
          ]
        },

        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '64%',

          plugins: {
            legend: {
              position: 'bottom'
            },

            tooltip: {
              callbacks: {
                label(context) {
                  return (
                    `${context.label}: ` +
                    `${formatNumber(
                      context.raw
                    )} phòng`
                  );
                }
              }
            }
          }
        }
      }
    );
  }

  function renderDashboard(
    reportData
  ) {
    renderStatCards(reportData);
    renderAlerts(reportData);
    renderRevenueChart(reportData);
    renderRoomStatusChart(
      reportData
    );
  }

  function loadDashboard() {
    setLoading(true);

    errorState.hidden = true;
    errorState.textContent = '';

    try {
      const reportData =
        reportService.getReportData({
          currentDate,
          expiringDays: 30,
          electricityMonth:
            currentMonth
        });

      renderDashboard(reportData);
    } catch (error) {
      destroyCharts();

      revenueChartCard.setEmpty(true);
      roomStatusChartCard.setEmpty(true);

      alertList.render([]);

      errorState.textContent =
        error instanceof Error
          ? error.message
          : 'Không thể tải dữ liệu Dashboard.';

      errorState.hidden = false;
    } finally {
      setLoading(false);
    }
  }

  refreshButton.addEventListener(
    'click',
    loadDashboard
  );

  /*
   * Router có thể gọi phương thức này trước khi loại bỏ trang
   * để giải phóng tài nguyên Chart.js.
   */
  page.destroy = destroyCharts;
  page.refresh = loadDashboard;

  loadDashboard();

  return page;
}

export const createPage =
  createDashboardPage;

export default createDashboardPage;