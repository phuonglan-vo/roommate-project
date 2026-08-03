import Chart from 'chart.js/auto';

import '../styles/reports.css';

import reportService from '../services/report-service.js';

import {
  createReportFilters
} from '../components/report-filters.js';

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
  const element = document.createElement(tagName);

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

function formatPercentage(value) {
  return `${formatNumber(value)}%`;
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

function normalizeArray(value) {
  return Array.isArray(value)
    ? value
    : [];
}

function filterRecordsByMonth(
  records,
  {
    fromMonth = '',
    toMonth = ''
  },
  monthField = 'month'
) {
  return normalizeArray(records).filter(
    (record) => {
      const month =
        String(
          record?.[monthField] ?? ''
        );

      if (
        fromMonth &&
        month < fromMonth
      ) {
        return false;
      }

      if (
        toMonth &&
        month > toMonth
      ) {
        return false;
      }

      return true;
    }
  );
}

function hasPositiveData(values) {
  return normalizeArray(values).some(
    (value) =>
      Number(value) > 0
  );
}

function createTableCell(
  content,
  className = ''
) {
  const cell = createElement('td', {
    className
  });

  if (
    content &&
    typeof content === 'object' &&
    'nodeType' in content
  ) {
    cell.append(content);
  } else {
    cell.textContent =
      String(content ?? '');
  }

  return cell;
}

function createReportSection({
  id,
  title,
  description,
  columns
}) {
  const canvas = createElement(
    'canvas',
    {
      attributes: {
        role: 'img',
        'aria-label': title
      },

      dataset: {
        testid:
          `${id}-chart-canvas`
      }
    }
  );

  const chartWrapper =
    createElement(
      'div',
      {
        className:
          'rm-report-section__chart',

        dataset: {
          testid:
            `${id}-chart`
        }
      },
      [canvas]
    );

  const chartEmptyState =
    createElement(
      'div',
      {
        className:
          'rm-report-section__empty',

        attributes: {
          hidden: ''
        },

        dataset: {
          testid:
            `${id}-chart-empty`
        }
      },
      [
        createElement('span', {
          className:
            'rm-report-section__empty-icon',

          text: '▥',

          attributes: {
            'aria-hidden': 'true'
          }
        }),

        createElement('p', {
          className: 'mb-0',
          text:
            'Chưa có dữ liệu để vẽ biểu đồ.'
        })
      ]
    );

  const tableBody = createElement(
    'tbody',
    {
      dataset: {
        testid:
          `${id}-table-body`
      }
    }
  );

  const table = createElement(
    'table',
    {
      className:
        'table align-middle mb-0 rm-report-table',

      dataset: {
        testid:
          `${id}-table`
      }
    },
    [
      createElement(
        'thead',
        {},
        [
          createElement(
            'tr',
            {},
            columns.map((column) =>
              createElement('th', {
                text: column.label,

                attributes: {
                  scope: 'col'
                }
              })
            )
          )
        ]
      ),

      tableBody
    ]
  );

  const tableWrapper =
    createElement(
      'div',
      {
        className:
          'table-responsive rm-report-section__table-wrapper'
      },
      [table]
    );

  const tableEmptyState =
    createElement('div', {
      className:
        'rm-report-section__table-empty',

      text:
        'Không có dữ liệu trong khoảng thời gian đã chọn.',

      attributes: {
        hidden: ''
      },

      dataset: {
        testid:
          `${id}-table-empty`
      }
    });

  const element = createElement(
    'section',
    {
      className:
        'rm-report-section',

      dataset: {
        testid: id
      }
    },
    [
      createElement(
        'header',
        {
          className:
            'rm-report-section__header'
        },
        [
          createElement('h3', {
            text: title
          }),

          createElement('p', {
            text: description
          })
        ]
      ),

      createElement(
        'div',
        {
          className:
            'rm-report-section__body'
        },
        [
          chartWrapper,
          chartEmptyState,
          tableWrapper,
          tableEmptyState
        ]
      )
    ]
  );

  function setChartEmpty(empty) {
    chartWrapper.hidden =
      Boolean(empty);

    chartEmptyState.hidden =
      !empty;
  }

  function renderTable(rows) {
    const normalizedRows =
      normalizeArray(rows);

    tableBody.replaceChildren();

    tableWrapper.hidden =
      normalizedRows.length === 0;

    tableEmptyState.hidden =
      normalizedRows.length > 0;

    normalizedRows.forEach(
      (row) => {
        const tableRow =
          createElement('tr');

        columns.forEach((column) => {
          tableRow.append(
            createTableCell(
              column.render
                ? column.render(row)
                : row[column.key],

              column.className ?? ''
            )
          );
        });

        tableBody.append(tableRow);
      }
    );
  }

  return {
    element,
    canvas,
    setChartEmpty,
    renderTable
  };
}

function getRoomLabel(record) {
  const roomCode =
    record.roomCode ??
    record.roomSnapshot?.code ??
    record.roomId ??
    'Không xác định';

  const roomName =
    record.roomName ??
    record.roomSnapshot?.name ??
    '';

  return roomName
    ? `${roomCode} — ${roomName}`
    : roomCode;
}

function getInvoiceStatusValue(record) {
  return (
    record.count ??
    record.invoiceCount ??
    0
  );
}

function getPaymentMethodAmount(record) {
  return (
    record.totalAmount ??
    record.amount ??
    0
  );
}

function getDebtAmount(record) {
  return (
    record.totalDebt ??
    record.remainingDebt ??
    0
  );
}

function getWaterUsage(record) {
  return (
    record.waterUsage ??
    record.usage ??
    0
  );
}

function resolveOptionalReport(
  methodName,
  argumentsList,
  fallback
) {
  const method =
    reportService[methodName];

  if (typeof method !== 'function') {
    return normalizeArray(fallback);
  }

  try {
    const result = method.call(
      reportService,
      ...argumentsList
    );

    return Array.isArray(result)
      ? result
      : normalizeArray(fallback);
  } catch {
    return normalizeArray(fallback);
  }
}

export function createReportsPage() {
  const charts = new Map();

  const state = {
    filters: {
      fromMonth: '',
      toMonth: ''
    }
  };

  const page = createElement('section', {
    className:
      'rm-reports-page',

    dataset: {
      testid: 'reports-page'
    }
  });

  const heading = createElement(
    'div',
    {
      className:
        'rm-reports-heading'
    },
    [
      createElement('div', {}, [
        createElement('h2', {
          className: 'h4 mb-1',
          text: 'Báo cáo'
        }),

        createElement('p', {
          className:
            'mb-0 text-body-secondary',

          text:
            'Phân tích doanh thu, công nợ, tiêu thụ và thanh toán.'
        })
      ])
    ]
  );

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
          'reports-error'
      }
    }
  );

  const revenueSection =
    createReportSection({
      id:
        'report-monthly-revenue',

      title:
        '1. Doanh thu theo tháng',

      description:
        'Tổng giá trị các hóa đơn được lập trong từng tháng.',

      columns: [
        {
          key: 'month',
          label: 'Tháng'
        },
        {
          key: 'invoiceCount',
          label: 'Số hóa đơn',

          className:
            'text-end',

          render: (row) =>
            formatNumber(
              row.invoiceCount ?? 0
            )
        },
        {
          key: 'invoiceValue',
          label:
            'Tổng giá trị hóa đơn',

          className:
            'text-end fw-semibold',

          render: (row) =>
            formatCurrency(
              row.invoiceValue ?? 0
            )
        }
      ]
    });

  const collectedSection =
    createReportSection({
      id:
        'report-monthly-collected',

      title:
        '2. Tiền thực thu theo tháng',

      description:
        'Tổng số tiền thực tế đã nhận từ các giao dịch thanh toán.',

      columns: [
        {
          key: 'month',
          label: 'Tháng'
        },
        {
          key: 'paymentCount',
          label: 'Số giao dịch',

          className:
            'text-end',

          render: (row) =>
            formatNumber(
              row.paymentCount ?? 0
            )
        },
        {
          key: 'collectedAmount',
          label: 'Tiền thực thu',

          className:
            'text-end fw-semibold',

          render: (row) =>
            formatCurrency(
              row.collectedAmount ?? 0
            )
        }
      ]
    });

  const debtSection =
    createReportSection({
      id:
        'report-debt-by-room',

      title:
        '3. Công nợ theo phòng',

      description:
        'Tổng số tiền còn nợ của từng phòng.',

      columns: [
        {
          key: 'roomId',
          label: 'Phòng',

          render: getRoomLabel
        },
        {
          key: 'invoiceCount',
          label:
            'Số hóa đơn còn nợ',

          className:
            'text-end',

          render: (row) =>
            formatNumber(
              row.invoiceCount ?? 0
            )
        },
        {
          key: 'totalDebt',
          label: 'Tổng công nợ',

          className:
            'text-end fw-semibold text-danger',

          render: (row) =>
            formatCurrency(
              getDebtAmount(row)
            )
        }
      ]
    });

  const electricitySection =
    createReportSection({
      id:
        'report-electricity-by-room',

      title:
        '4. Điện tiêu thụ theo phòng',

      description:
        'Tổng lượng điện tiêu thụ của từng phòng.',

      columns: [
        {
          key: 'roomId',
          label: 'Phòng',

          render: getRoomLabel
        },
        {
          key: 'readingCount',
          label: 'Số kỳ ghi',

          className:
            'text-end',

          render: (row) =>
            formatNumber(
              row.readingCount ?? 0
            )
        },
        {
          key: 'electricityUsage',
          label:
            'Điện tiêu thụ',

          className:
            'text-end fw-semibold',

          render: (row) =>
            `${formatNumber(
              row.electricityUsage ?? 0
            )} kWh`
        }
      ]
    });

  const waterSection =
    createReportSection({
      id:
        'report-water-by-room',

      title:
        '5. Nước tiêu thụ theo phòng',

      description:
        'Tổng lượng nước tiêu thụ của từng phòng.',

      columns: [
        {
          key: 'roomId',
          label: 'Phòng',

          render: getRoomLabel
        },
        {
          key: 'readingCount',
          label: 'Số kỳ ghi',

          className:
            'text-end',

          render: (row) =>
            formatNumber(
              row.readingCount ?? 0
            )
        },
        {
          key: 'waterUsage',
          label:
            'Nước tiêu thụ',

          className:
            'text-end fw-semibold',

          render: (row) =>
            `${formatNumber(
              getWaterUsage(row)
            )} m³`
        }
      ]
    });

  const invoiceStatusSection =
    createReportSection({
      id:
        'report-invoice-status',

      title:
        '6. Trạng thái hóa đơn',

      description:
        'Số lượng và tỷ lệ hóa đơn theo từng trạng thái.',

      columns: [
        {
          key: 'label',
          label: 'Trạng thái'
        },
        {
          key: 'count',
          label: 'Số hóa đơn',

          className:
            'text-end',

          render: (row) =>
            formatNumber(
              getInvoiceStatusValue(
                row
              )
            )
        },
        {
          key: 'percentage',
          label: 'Tỷ lệ',

          className:
            'text-end fw-semibold',

          render: (row) =>
            formatPercentage(
              row.percentage ?? 0
            )
        }
      ]
    });

  const paymentMethodSection =
    createReportSection({
      id:
        'report-payment-method',

      title:
        '7. Thanh toán theo phương thức',

      description:
        'Tổng số tiền và số giao dịch theo từng phương thức thanh toán.',

      columns: [
        {
          key: 'label',
          label: 'Phương thức'
        },
        {
          key: 'paymentCount',
          label: 'Số giao dịch',

          className:
            'text-end',

          render: (row) =>
            formatNumber(
              row.paymentCount ?? 0
            )
        },
        {
          key: 'totalAmount',
          label: 'Tổng thanh toán',

          className:
            'text-end fw-semibold',

          render: (row) =>
            formatCurrency(
              getPaymentMethodAmount(
                row
              )
            )
        }
      ]
    });

  const reportsContainer =
    createElement(
      'div',
      {
        className:
          'rm-reports-grid'
      },
      [
        revenueSection.element,
        collectedSection.element,
        debtSection.element,
        electricitySection.element,
        waterSection.element,
        invoiceStatusSection.element,
        paymentMethodSection.element
      ]
    );

  const reportFilters =
    createReportFilters({
      async onApply(filters) {
        state.filters = {
          ...filters
        };

        loadReports();
      }
    });

  page.append(
    heading,
    reportFilters.element,
    errorState,
    reportsContainer
  );

  function destroyChart(chartId) {
    const chart =
      charts.get(chartId);

    if (chart) {
      chart.destroy();
      charts.delete(chartId);
    }
  }

  function destroyAllCharts() {
    charts.forEach((chart) => {
      chart.destroy();
    });

    charts.clear();
  }

  function renderChart({
    chartId,
    section,
    type,
    labels,
    datasets,
    options = {}
  }) {
    destroyChart(chartId);

    const normalizedLabels =
      normalizeArray(labels);

    const normalizedDatasets =
      normalizeArray(datasets);

    const hasData =
      normalizedLabels.length > 0 &&
      normalizedDatasets.some(
        (dataset) =>
          hasPositiveData(
            dataset.data
          )
      );

    section.setChartEmpty(
      !hasData
    );

    if (!hasData) {
      return;
    }

    const chart = new Chart(
      section.canvas,
      {
        type,

        data: {
          labels:
            normalizedLabels,

          datasets:
            normalizedDatasets
        },

        options: {
          responsive: true,
          maintainAspectRatio: false,

          plugins: {
            legend: {
              position: 'bottom'
            }
          },

          ...options
        }
      }
    );

    charts.set(chartId, chart);
  }

  function renderRevenueReport(records) {
    revenueSection.renderTable(records);

    renderChart({
      chartId: 'revenue',
      section: revenueSection,
      type: 'bar',

      labels: records.map(
        (record) => record.month
      ),

      datasets: [
        {
          label:
            'Tổng giá trị hóa đơn',

          data: records.map(
            (record) =>
              record.invoiceValue ?? 0
          ),

          backgroundColor:
            'rgba(37, 99, 235, 0.72)',

          borderColor:
            'rgb(37, 99, 235)',

          borderWidth: 1,
          borderRadius: 5
        }
      ],

      options: {
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
        }
      }
    });
  }

  function renderCollectedReport(records) {
    collectedSection.renderTable(
      records
    );

    renderChart({
      chartId: 'collected',
      section: collectedSection,
      type: 'line',

      labels: records.map(
        (record) => record.month
      ),

      datasets: [
        {
          label:
            'Tiền thực thu',

          data: records.map(
            (record) =>
              record.collectedAmount ??
              0
          ),

          borderColor:
            'rgb(22, 163, 74)',

          backgroundColor:
            'rgba(22, 163, 74, 0.16)',

          borderWidth: 2,
          fill: true,
          tension: 0.25
        }
      ],

      options: {
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
        },

        plugins: {
          legend: {
            position: 'bottom'
          },

          tooltip: {
            callbacks: {
              label(context) {
                return (
                  `Tiền thực thu: ` +
                  `${formatCurrency(
                    context.raw
                  )}`
                );
              }
            }
          }
        }
      }
    });
  }

  function renderDebtReport(records) {
    debtSection.renderTable(records);

    renderChart({
      chartId: 'debt',
      section: debtSection,
      type: 'bar',

      labels: records.map(
        getRoomLabel
      ),

      datasets: [
        {
          label: 'Công nợ',

          data: records.map(
            getDebtAmount
          ),

          backgroundColor:
            'rgba(220, 38, 38, 0.72)',

          borderColor:
            'rgb(220, 38, 38)',

          borderWidth: 1,
          borderRadius: 5
        }
      ],

      options: {
        indexAxis: 'y',

        scales: {
          x: {
            beginAtZero: true,

            ticks: {
              callback(value) {
                return formatCurrency(
                  value
                );
              }
            }
          },

          y: {
            grid: {
              display: false
            }
          }
        },

        plugins: {
          legend: {
            position: 'bottom'
          },

          tooltip: {
            callbacks: {
              label(context) {
                return (
                  `Công nợ: ` +
                  `${formatCurrency(
                    context.raw
                  )}`
                );
              }
            }
          }
        }
      }
    });
  }

  function renderElectricityReport(
    records
  ) {
    electricitySection.renderTable(
      records
    );

    renderChart({
      chartId: 'electricity',
      section:
        electricitySection,
      type: 'bar',

      labels: records.map(
        getRoomLabel
      ),

      datasets: [
        {
          label:
            'Điện tiêu thụ',

          data: records.map(
            (record) =>
              record.electricityUsage ??
              0
          ),

          backgroundColor:
            'rgba(245, 158, 11, 0.72)',

          borderColor:
            'rgb(245, 158, 11)',

          borderWidth: 1,
          borderRadius: 5
        }
      ],

      options: {
        scales: {
          y: {
            beginAtZero: true,

            title: {
              display: true,
              text: 'kWh'
            }
          },

          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  function renderWaterReport(records) {
    waterSection.renderTable(records);

    renderChart({
      chartId: 'water',
      section: waterSection,
      type: 'bar',

      labels: records.map(
        getRoomLabel
      ),

      datasets: [
        {
          label:
            'Nước tiêu thụ',

          data: records.map(
            getWaterUsage
          ),

          backgroundColor:
            'rgba(14, 165, 233, 0.72)',

          borderColor:
            'rgb(14, 165, 233)',

          borderWidth: 1,
          borderRadius: 5
        }
      ],

      options: {
        scales: {
          y: {
            beginAtZero: true,

            title: {
              display: true,
              text: 'm³'
            }
          },

          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  function renderInvoiceStatusReport(
    records
  ) {
    invoiceStatusSection.renderTable(
      records
    );

    renderChart({
      chartId: 'invoice-status',
      section:
        invoiceStatusSection,
      type: 'doughnut',

      labels: records.map(
        (record) =>
          record.label ??
          record.status
      ),

      datasets: [
        {
          label: 'Hóa đơn',

          data: records.map(
            getInvoiceStatusValue
          ),

          backgroundColor: [
            'rgba(245, 158, 11, 0.78)',
            'rgba(249, 115, 22, 0.78)',
            'rgba(22, 163, 74, 0.78)',
            'rgba(220, 38, 38, 0.78)',
            'rgba(100, 116, 139, 0.78)'
          ],

          borderColor: [
            'rgb(245, 158, 11)',
            'rgb(249, 115, 22)',
            'rgb(22, 163, 74)',
            'rgb(220, 38, 38)',
            'rgb(100, 116, 139)'
          ],

          borderWidth: 1
        }
      ],

      options: {
        cutout: '62%'
      }
    });
  }

  function renderPaymentMethodReport(
    records
  ) {
    paymentMethodSection.renderTable(
      records
    );

    renderChart({
      chartId: 'payment-method',
      section:
        paymentMethodSection,
      type: 'pie',

      labels: records.map(
        (record) =>
          record.label ??
          record.method
      ),

      datasets: [
        {
          label:
            'Tổng thanh toán',

          data: records.map(
            getPaymentMethodAmount
          ),

          backgroundColor: [
            'rgba(22, 163, 74, 0.78)',
            'rgba(37, 99, 235, 0.78)',
            'rgba(126, 34, 206, 0.78)',
            'rgba(14, 165, 233, 0.78)',
            'rgba(100, 116, 139, 0.78)'
          ],

          borderColor: [
            'rgb(22, 163, 74)',
            'rgb(37, 99, 235)',
            'rgb(126, 34, 206)',
            'rgb(14, 165, 233)',
            'rgb(100, 116, 139)'
          ],

          borderWidth: 1
        }
      ],

      options: {
        plugins: {
          legend: {
            position: 'bottom'
          },

          tooltip: {
            callbacks: {
              label(context) {
                return (
                  `${context.label}: ` +
                  `${formatCurrency(
                    context.raw
                  )}`
                );
              }
            }
          }
        }
      }
    });
  }

  function getReportViewData(
    reportData
  ) {
    const details =
      reportData.details ?? {};

    const filteredRevenue =
      filterRecordsByMonth(
        details.invoiceValueByMonth,
        state.filters
      );

    const filteredCollected =
      filterRecordsByMonth(
        details.collectedAmountByMonth,
        state.filters
      );

    const singleMonth =
      state.filters.fromMonth &&
      state.filters.fromMonth ===
        state.filters.toMonth
        ? state.filters.fromMonth
        : null;

    const electricityByRoom =
      singleMonth &&
      typeof reportService
        .getElectricUsageByRoom ===
        'function'
        ? resolveOptionalReport(
            'getElectricUsageByRoom',
            [singleMonth],
            details.electricUsageByRoom
          )
        : normalizeArray(
            details.electricUsageByRoom
          );

    const debtByRoom =
      resolveOptionalReport(
        'getDebtByRoom',
        [
          {
            ...state.filters
          }
        ],
        details.debtByRoom
      );

    const waterByRoom =
      resolveOptionalReport(
        'getWaterUsageByRoom',
        [
          singleMonth ??
          {
            ...state.filters
          }
        ],
        details.waterUsageByRoom
      );

    return {
      revenue:
        filteredRevenue,

      collected:
        filteredCollected,

      debtByRoom,

      electricityByRoom,

      waterByRoom,

      invoiceStatus:
        normalizeArray(
          details
            .invoiceStatusDistribution
        ),

      paymentMethods:
        normalizeArray(
          details.paymentsByMethod
        )
    };
  }

  function renderReports(viewData) {
    destroyAllCharts();

    renderRevenueReport(
      viewData.revenue
    );

    renderCollectedReport(
      viewData.collected
    );

    renderDebtReport(
      viewData.debtByRoom
    );

    renderElectricityReport(
      viewData.electricityByRoom
    );

    renderWaterReport(
      viewData.waterByRoom
    );

    renderInvoiceStatusReport(
      viewData.invoiceStatus
    );

    renderPaymentMethodReport(
      viewData.paymentMethods
    );
  }

  function loadReports() {
    reportFilters.setLoading(true);

    errorState.hidden = true;
    errorState.textContent = '';

    try {
      const singleMonth =
        state.filters.fromMonth &&
        state.filters.fromMonth ===
          state.filters.toMonth
          ? state.filters.fromMonth
          : null;

      const reportData =
        reportService.getReportData({
          currentDate:
            getCurrentDateInVietnam(),

          fromMonth:
            state.filters.fromMonth,

          toMonth:
            state.filters.toMonth,

          electricityMonth:
            singleMonth
        });

      const viewData =
        getReportViewData(
          reportData
        );

      renderReports(viewData);
    } catch (error) {
      destroyAllCharts();

      errorState.textContent =
        error instanceof Error
          ? error.message
          : 'Không thể tải dữ liệu báo cáo.';

      errorState.hidden = false;

      renderReports({
        revenue: [],
        collected: [],
        debtByRoom: [],
        electricityByRoom: [],
        waterByRoom: [],
        invoiceStatus: [],
        paymentMethods: []
      });
    } finally {
      reportFilters.setLoading(false);
    }
  }

  page.destroy = destroyAllCharts;
  page.refresh = loadReports;

  loadReports();

  return page;
}

export const createPage =
  createReportsPage;

export default createReportsPage;