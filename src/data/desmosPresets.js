// src/data/desmosPresets.js

export const DESMOS_PRESET_CATEGORIES = [
  {
    id: 'all',
    label: 'Tất cả Hacks'.normalize('NFC'),
    icon: '⚡',
  },
  {
    id: 'regression',
    label: '📊 Hồi quy số liệu'.normalize('NFC'),
    icon: '📊',
  },
  {
    id: 'systems',
    label: '🎯 Hệ PT & Tham số k'.normalize('NFC'),
    icon: '🎯',
  },
  {
    id: 'circles',
    label: '⭕ Đường tròn tọa độ'.normalize('NFC'),
    icon: '⭕',
  },
  {
    id: 'vertex',
    label: '🏔️ Đỉnh & Cực trị Parabol'.normalize('NFC'),
    icon: '🏔️',
  },
  {
    id: 'inequalities',
    label: '📐 Miền nghiệm BPT'.normalize('NFC'),
    icon: '📐',
  },
];

export const DESMOS_PRESETS = [
  // =========================================================================
  // 1. 📊 HỒI QUY SỐ LIỆU (REGRESSION & TABLE FITTING)
  // =========================================================================
  {
    id: 'reg_quadratic',
    category: 'regression',
    badge: 'Regression • Bậc hai'.normalize('NFC'),
    title: 'Hồi quy Bậc hai qua bảng tọa độ (Quadratic Regression)'.normalize('NFC'),
    tip: 'Khi đề cho 3 điểm trên Parabol hoặc bảng giá trị, nhập vào (x₁, y₁) để lấy ngay hệ số a, b, c.'.normalize('NFC'),
    formulaPreview: 'y₁ ~ a x₁² + b x₁ + c',
    bounds: { left: -6, right: 10, bottom: -8, top: 20 },
    expressions: [
      {
        type: 'table',
        id: 'sat_table_quad',
        columns: [
          { latex: 'x_1', values: ['0', '2', '4', '6'] },
          { latex: 'y_1', values: ['3', '-1', '3', '15'] },
        ],
      },
      {
        id: 'sat_reg_quad_eq',
        latex: 'y_1 \\sim a x_1^2 + b x_1 + c',
        color: '#7c3aed',
      },
    ],
  },
  {
    id: 'reg_exponential',
    category: 'regression',
    badge: 'Regression • Hàm mũ'.normalize('NFC'),
    title: 'Hồi quy Hàm mũ tăng trưởng (Exponential Regression)'.normalize('NFC'),
    tip: 'Giải nhanh bài toán lãi kép, dân số hoặc phóng xạ khi biết giá trị tại các mốc thời gian.'.normalize('NFC'),
    formulaPreview: 'y₁ ~ a(b)^x₁',
    bounds: { left: -2, right: 8, bottom: -5, top: 60 },
    expressions: [
      {
        type: 'table',
        id: 'sat_table_exp',
        columns: [
          { latex: 'x_1', values: ['0', '1', '2', '3'] },
          { latex: 'y_1', values: ['4', '12', '36', '108'] },
        ],
      },
      {
        id: 'sat_reg_exp_eq',
        latex: 'y_1 \\sim a(b)^{x_1}',
        color: '#059669',
      },
    ],
  },
  {
    id: 'reg_linear',
    category: 'regression',
    badge: 'Regression • Tuyến tính'.normalize('NFC'),
    title: 'Hồi quy Tuyến tính tìm đường thẳng (Linear Regression)'.normalize('NFC'),
    tip: 'Nhập 2–3 điểm từ đề bài vào bảng (x₁, y₁), Desmos tự tìm hệ số góc m và tung độ gốc b tức thì.'.normalize('NFC'),
    formulaPreview: 'y₁ ~ m x₁ + b',
    bounds: { left: -4, right: 12, bottom: -4, top: 22 },
    expressions: [
      {
        type: 'table',
        id: 'sat_table_linear',
        columns: [
          { latex: 'x_1', values: ['1', '3', '5', '7'] },
          { latex: 'y_1', values: ['5', '11', '17', '23'] },
        ],
      },
      {
        id: 'sat_reg_linear_eq',
        latex: 'y_1 \\sim m x_1 + b',
        color: '#2563eb',
      },
    ],
  },

  // =========================================================================
  // 2. 🎯 KHẢO SÁT HỆ PHƯƠNG TRÌNH & THAM SỐ K (SYSTEMS & SLIDERS)
  // =========================================================================
  {
    id: 'sys_parabola_line_tangent',
    category: 'systems',
    badge: 'Systems • Số nghiệm Đường thẳng & Parabol'.normalize('NFC'),
    title: 'Số nghiệm hệ Đường thẳng & Parabol với tham số k ∈ [-10, 10]'.normalize('NFC'),
    tip: 'Kéo thanh trượt k ∈ [-10, 10] trực quan để tìm vị trí tiếp xúc 1 nghiệm (k = -6) hoặc cắt tại 2 nghiệm phân biệt.'.normalize('NFC'),
    formulaPreview: 'y = x² - 4x + 3  &  y = 2x + k',
    bounds: { left: -5, right: 11, bottom: -10, top: 14 },
    expressions: [
      {
        id: 'sat_tan_parabola',
        latex: 'y = x^2 - 4x + 3',
        color: '#7c3aed',
      },
      {
        id: 'sat_tan_line',
        latex: 'y = 2x + k',
        color: '#d97706',
      },
      {
        id: 'sat_tan_slider_k',
        latex: 'k = -6',
        sliderBounds: { min: '-10', max: '10', step: '0.25' },
      },
      {
        id: 'sat_tan_point',
        latex: '(3, 0)',
        color: '#059669',
        label: 'Tiếp điểm (3, 0) khi k = -6'.normalize('NFC'),
        showLabel: true,
      },
    ],
  },
  {
    id: 'sys_no_infinite_sol',
    category: 'systems',
    badge: 'Systems • Vô số nghiệm / Vô nghiệm'.normalize('NFC'),
    title: 'Hệ 2 đường thẳng song song hoặc trùng nhau (y = 2x + 3 & y = kx + c)'.normalize('NFC'),
    tip: 'Kéo thanh trượt k và c: Hai đường song song (cùng hệ số góc k = 2, c ≠ 3) => Vô nghiệm; Trùng nhau (k = 2, c = 3) => Vô số nghiệm.'.normalize('NFC'),
    formulaPreview: 'y = 2x + 3  &  y = kx + c',
    bounds: { left: -10, right: 10, bottom: -10, top: 10 },
    expressions: [
      {
        id: 'sat_sys_l1',
        latex: 'y = 2x + 3',
        color: '#2563eb',
      },
      {
        id: 'sat_sys_l2',
        latex: 'y = k x + c',
        color: '#e11d48',
      },
      {
        id: 'sat_sys_slider_k',
        latex: 'k = 2',
        sliderBounds: { min: '-10', max: '10', step: '0.1' },
      },
      {
        id: 'sat_sys_slider_c',
        latex: 'c = -2',
        sliderBounds: { min: '-10', max: '10', step: '0.5' },
      },
    ],
  },

  // =========================================================================
  // 3. ⭕ ĐƯỜNG TRÒN TỌA ĐỘ (CIRCLE EQUATIONS)
  // =========================================================================
  {
    id: 'circle_standard',
    category: 'circles',
    badge: 'Geometry • Chính tắc'.normalize('NFC'),
    title: 'Phương trình chính tắc Đường tròn & Tâm (h, k)'.normalize('NFC'),
    tip: 'Quan sát trực tiếp tâm (h, k), bán kính r và các điểm cực đại/cực tiểu trên đường tròn.'.normalize('NFC'),
    formulaPreview: '(x - h)² + (y - k)² = r²',
    bounds: { left: -8, right: 12, bottom: -8, top: 8 },
    expressions: [
      {
        id: 'sat_cir_eq',
        latex: '(x - h)^2 + (y - k)^2 = r^2',
        color: '#0284c7',
      },
      {
        id: 'sat_cir_h',
        latex: 'h = 2',
        sliderBounds: { min: '-10', max: '10', step: '0.5' },
      },
      {
        id: 'sat_cir_k',
        latex: 'k = -1',
        sliderBounds: { min: '-10', max: '10', step: '0.5' },
      },
      {
        id: 'sat_cir_r',
        latex: 'r = 4',
        sliderBounds: { min: '0.5', max: '12', step: '0.5' },
      },
      {
        id: 'sat_cir_center',
        latex: '(h, k)',
        color: '#e11d48',
        label: 'Tâm (h, k)'.normalize('NFC'),
        showLabel: true,
      },
    ],
  },
  {
    id: 'circle_general',
    category: 'circles',
    badge: 'Geometry • Dạng khai triển'.normalize('NFC'),
    title: 'Phương trình Đường tròn dạng tổng quát (Không cần nhóm hằng đẳng thức)'.normalize('NFC'),
    tip: 'Gõ thẳng phương trình x² + y² + Ax + By + C = 0 vào Desmos rồi click điểm cực trên/dưới để suy ra tâm và bán kính!'.normalize('NFC'),
    formulaPreview: 'x² + y² + Ax + By + C = 0',
    bounds: { left: -6, right: 12, bottom: -9, top: 7 },
    expressions: [
      {
        id: 'sat_cir_gen_eq',
        latex: 'x^2 + y^2 + A x + B y + C = 0',
        color: '#9333ea',
      },
      {
        id: 'sat_cir_gen_a',
        latex: 'A = -6',
        sliderBounds: { min: '-20', max: '20', step: '1' },
      },
      {
        id: 'sat_cir_gen_b',
        latex: 'B = 4',
        sliderBounds: { min: '-20', max: '20', step: '1' },
      },
      {
        id: 'sat_cir_gen_c',
        latex: 'C = -12',
        sliderBounds: { min: '-50', max: '20', step: '1' },
      },
      {
        id: 'sat_cir_gen_center',
        latex: '(-A/2, -B/2)',
        color: '#16a34a',
        label: 'Tâm tự động (-A/2, -B/2)'.normalize('NFC'),
        showLabel: true,
      },
    ],
  },

  // =========================================================================
  // 4. 🏔️ ĐỈNH VÀ TRỤC ĐỐI XỨNG PARABOL (VERTEX & EXTREMA)
  // =========================================================================
  {
    id: 'vertex_parabola_extrema',
    category: 'vertex',
    badge: 'Algebra • Vertex Form'.normalize('NFC'),
    title: 'Đỉnh Parabol, Cực trị & Trục đối xứng x = h'.normalize('NFC'),
    tip: 'Biểu diễn hàm bậc hai dạng đỉnh y = a(x - h)² + k kèm điểm cực trị (h, k) và đường trục đối xứng x = h.'.normalize('NFC'),
    formulaPreview: 'f(x) = a(x - h)² + k',
    bounds: { left: -5, right: 11, bottom: -8, top: 10 },
    expressions: [
      {
        id: 'sat_vtx_fn',
        latex: 'f(x) = a(x - h)^2 + k',
        color: '#2563eb',
      },
      {
        id: 'sat_vtx_a',
        latex: 'a = 1',
        sliderBounds: { min: '-5', max: '5', step: '0.25' },
      },
      {
        id: 'sat_vtx_h',
        latex: 'h = 3',
        sliderBounds: { min: '-10', max: '10', step: '0.5' },
      },
      {
        id: 'sat_vtx_k',
        latex: 'k = -4',
        sliderBounds: { min: '-10', max: '10', step: '0.5' },
      },
      {
        id: 'sat_vtx_point',
        latex: '(h, k)',
        color: '#dc2626',
        label: 'Đỉnh cực trị Vertex (h, k)'.normalize('NFC'),
        showLabel: true,
      },
      {
        id: 'sat_vtx_axis',
        latex: 'x = h',
        color: '#64748b',
        lineStyle: 'DASHED',
      },
    ],
  },

  // =========================================================================
  // 5. 📐 MIỀN NGHIỆM BẤT PHƯƠNG TRÌNH (INEQUALITIES & FEASIBLE REGION)
  // =========================================================================
  {
    id: 'ineq_feasible_region',
    category: 'inequalities',
    badge: 'Inequalities • Miền nghiệm'.normalize('NFC'),
    title: 'Hệ Bất phương trình & Vùng giao thoa nghiệm (Feasible Region)'.normalize('NFC'),
    tip: 'Vùng tô đậm chồng lên nhau của cả 2 màu là miền nghiệm thỏa mãn hệ. Kiểm tra nhanh tọa độ (x, y) thuộc vùng giao!'.normalize('NFC'),
    formulaPreview: 'y ≤ -2/3 x + 4  &  y > x² - 2',
    bounds: { left: -6, right: 8, bottom: -5, top: 8 },
    expressions: [
      {
        id: 'sat_ineq_1',
        latex: 'y \\le -\\frac{2}{3}x + 4',
        color: '#0284c7',
      },
      {
        id: 'sat_ineq_2',
        latex: 'y > x^2 - 2',
        color: '#16a34a',
      },
      {
        id: 'sat_ineq_test_pt',
        latex: '(0, 1)',
        color: '#f59e0b',
        label: 'Điểm thử (0, 1) thuộc miền nghiệm'.normalize('NFC'),
        showLabel: true,
      },
    ],
  },
];
