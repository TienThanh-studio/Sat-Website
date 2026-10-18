// src/pages/DesmosSimPage.jsx
import React, { useState, useMemo, useRef } from 'react';
import {
  Calculator,
  Sparkles,
  Copy,
  Play,
  Sliders,
  GraduationCap,
  FileText,
  Upload,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import DesmosModal from '../components/exam/DesmosModal';
import MathRenderer from '../components/common/MathRenderer';

// ============================================================================
// TOÀN BỘ NỘI DUNG & CÚ PHÁP BÍ KÍP TỪ FILE "Math desmos_Key.pdf" (44 TRANG)
// ============================================================================
const DESMOS_PDF_PAGES = [
  {
    page: 'Trang 2 - 3',
    category: 'Core Tricks (5 Kỹ Thuật Cốt Lõi)',
    title: '1. Solving Equations • 2. Solving Systems • 3. Finding Constants • 4. Table Abuse • 5. Stats',
    content: `**1. Giải phương trình 1 ẩn bằng Hồi quy (~):**
Thay dấu \`=\` bằng dấu \`~\` và đổi biến \`x\` thành \`x_1\` để Desmos tự tìm nghiệm mà không cần nhìn đồ thị.

**2. Giải hệ phương trình bằng Danh sách (List Regression):**
Gộp vế trái của 2 phương trình vào \`[PT1, PT2] ~ [VP1, VP2]\`.

**3. Tìm hằng số chưa biết (Finding Constants):**
Khai báo danh sách \`x_2 = [1, 2, 3, 4, 5]\` rồi dùng \`~\` để ép 2 đa thức đồng nhất với nhau.

**4. Thống kê (Mean, Median, Standard Deviation):**
Đặt mảng \`B = [5, 6, 7, 8, 9, 19]\` rồi gọi \`mean(B)\`, \`median(B)\`, \`stdev(B)\`.`,
    Note: 'Mẹo: Khi RMSE = 0 (hoặc cỡ 10⁻¹⁴), nghiệm tìm được là chính xác tuyệt đối!',
    Presets: [
      {
        label: '1. Giải PT: 4x₁ ~ 5',
        expressions: [{ id: 'p2_1', latex: '4x_1 \\sim 5' }],
      },
      {
        label: '2. Giải Hệ: [3x₁+y₁, 3x₁-2y₁] ~ [5, 14]',
        expressions: [{ id: 'p2_2', latex: '[3x_1 + y_1, 3x_1 - 2y_1] \\sim [5, 14]' }],
      },
      {
        label: '3. Tìm hằng số a, b đa thức bậc 3',
        expressions: [
          { id: 'p2_3a', latex: 'x_2 = [1, 2, 3, 4, 5]' },
          { id: 'p2_3b', latex: '(a x_2 - 4)(3x_2^2 - b x_2 + 2) \\sim 15x_2^3 - 22x_2^2 + 3' },
        ],
      },
      {
        label: '5. Mean, Median, Stdev của mảng B',
        expressions: [
          { id: 'p3_1', latex: 'B = [5, 6, 7, 8, 9, 19]' },
          { id: 'p3_2', latex: '\\operatorname{mean}(B)' },
          { id: 'p3_3', latex: '\\operatorname{median}(B)' },
          { id: 'p3_4', latex: '\\operatorname{stdev}(B)' },
        ],
      },
    ],
  },
  {
    page: 'Trang 4 - 5',
    category: 'Using Regression (Hồi Quy Hàm Số)',
    title: 'Tìm hàm tuyến tính g(x) = ax + b & Hàm mũ f(x) = a·b^(x/n)',
    content: `**Bài mẫu 1 (Trang 4):** Cho hàm tuyến tính $g(x) = ax + b$. Biết $g(-5) = -8$ và $g(2) = 6$. Tìm $a$?
- Dòng 1: \`f(x) = ax + b\`
- Dòng 2: \`f([-5, 2]) ~ [-8, 6]\` $\\Rightarrow$ Ra ngay $a = 2, b = 2$.

**Bài mẫu 2 (Trang 4):** Cho $f(x) = a \\cdot b^{x/n}$. Biết $f(2) = 6$ và $f(5) = 162$. Tính $f(7)$?
- Dòng 1: \`f(x) = a * b^(x/n)\`
- Dòng 2: \`f([2, 5]) ~ [6, 162]\`
- Dòng 3: \`f(7)\` $\\Rightarrow$ Kết quả \`= 1458\`.

**Practice Question 1 (Trang 5):** Cho $f(x) = a \\cdot b^{x/n}$ với $f(4) = 5$ và $f(7) = 135$. Tính $f(9)$?
- *Giải tay siêu tốc:* Chia 2 vế $\\frac{f(7)}{f(4)} = b^{3/n} = \\frac{135}{5} = 27 \\Rightarrow b^{1/n} = 3$. Vậy $f(9) = f(7) \\cdot 3^2 = 135 \\times 9 = 1215$.`,
    Note: 'Lưu ý: Có thể gõ thẳng f([-5, 2]) ~ [-8, 6] thay vì phải kẻ bảng x₁, y₁!',
    Presets: [
      {
        label: 'Nạp Bài mẫu 1: f([-5, 2]) ~ [-8, 6]',
        expressions: [
          { id: 'p4_1', latex: 'f(x) = ax + b' },
          { id: 'p4_2', latex: 'f([-5, 2]) \\sim [-8, 6]' },
        ],
      },
      {
        label: 'Nạp Bài mẫu 2: Hàm mũ f(7) = 1458',
        expressions: [
          { id: 'p4_3', latex: 'f(x) = a \\cdot b^{\\frac{x}{n}}' },
          { id: 'p4_4', latex: 'f([2, 5]) \\sim [6, 162]' },
          { id: 'p4_5', latex: 'f(7)' },
        ],
      },
    ],
  },
  {
    page: 'Trang 5 - 7',
    category: 'Practice Questions 2, 3, 4, 5',
    title: 'Hàm phân thức, Hồi quy tham số c & Phương trình căn thức',
    content: `**Practice Question 2 (Trang 5-6):** Cho $v(x) = \\frac{x^2 + bx + c}{(x+5)(x-19)}$ đi qua $(0, \\frac{66}{95})$ và $(11, 0)$. Nếu $v(q) = 0$ thì $q$ bằng bao nhiêu?
- Dùng hồi quy với 2 điểm $x_1 = [0, 11]$ và $y_1 = [66/95, 0]$ tìm được $b = -5, c = -66$. Nghiệm tử số là $(-6, 0) \\Rightarrow$ **Đáp án A (-6)**.

**Practice Question 3 (Trang 6):** Cho $p(x) = \\frac{(x-c)^2 + 160}{2c}$. Nếu $p(c) = 10$, tính $p(12)$?
- Nhập \`p(x) = ((x-c)^2 + 160)/(2c)\` và \`p(c) ~ 10\` $\\Rightarrow c = 8 \\Rightarrow p(12) = 11$ (**Đáp án D**).

**Practice Question 4 (Trang 6):** Nếu $x = \\sqrt[2n]{5x^n + 50}$, tính giá trị của $x^n$?
- Đặt $x_1 = x^n$, phương trình trở thành \`x_1 ~ sqrt(5x_1 + 50)\` $\\Rightarrow x_1 = 10$.`,
    Note: 'Mẹo Practice 4: Đặt cả cụm xⁿ thành 1 biến x₁ duy nhất để bấm hồi quy trong 3 giây!',
    Presets: [
      {
        label: 'Nạp Practice 2: Tìm b, c hàm phân thức',
        expressions: [
          { id: 'p6_1', latex: 'x_1 = [0, 11]' },
          { id: 'p6_2', latex: 'y_1 = [\\frac{66}{95}, 0]' },
          { id: 'p6_3', latex: 'y_1 \\sim \\frac{x_1^2 + b x_1 + c}{(x_1 + 5)(x_1 - 19)}' },
          { id: 'p6_4', latex: 'y = \\frac{x^2 + bx + c}{(x + 5)(x - 19)}' },
        ],
      },
      {
        label: 'Nạp Practice 3: p(c) ~ 10 => p(12) = 11',
        expressions: [
          { id: 'p6_5', latex: 'p(x) = \\frac{(x - c)^2 + 160}{2c}' },
          { id: 'p6_6', latex: 'p(c) \\sim 10' },
          { id: 'p6_7', latex: 'p(12)' },
        ],
      },
      {
        label: 'Nạp Practice 4: x₁ ~ √(5x₁ + 50)',
        expressions: [{ id: 'p6_8', latex: 'x_1 \\sim \\sqrt{5x_1 + 50}' }],
      },
    ],
  },
  {
    page: 'Trang 8 - 9',
    category: 'Vertex Form & Bậc 4 Trùng Phương',
    title: 'Đồ thị đi qua (r, 21), (2r, 123) & Dạng Đỉnh Parabol y = a(x - h)² + k',
    content: `**Bài 1 (Trang 8):** Đồ thị $f(x) = 8x^2 + kx - 17$ đi qua $(r, 21)$ và $(2r, 123)$. Tìm $k$?
- Gõ \`f(x) = 8x^2 + kx - 17\` và \`[f(r), f(2r)] ~ [21, 123]\` $\\Rightarrow k = 3, r = 2$ (**Đáp án A**).

**Bài 2 (Trang 8 - Vertex Form):** Hàm bậc hai $f(x)$ có đỉnh $(4, -6)$, đi qua $(3, -8)$, cắt Oy tại $(0, a)$. Đồ thị $y = 5f(x)$ cắt Oy tại $(0, b)$. Tính $|a - b|$?
- Dùng dạng đỉnh: \`f(x) = a(x - 4)^2 - 6\` và \`f(3) ~ -8\` $\\Rightarrow a_{hs} = -2 \\Rightarrow |f(0) - 5f(0)| = 152$.

**Bài 3 (Trang 9):** Cho $p(x) = a((x+6)^2 - b)((x+6)^2 - c)$ đi qua $(-7, 24)$ và $(0, 899)$. Tính $p(-12) + p(-5)$?
- Do tính đối xứng qua $x = -6$, ta có $p(-12) = p(0) = 899$ và $p(-5) = p(-7) = 24 \\Rightarrow 899 + 24 = 923$!`,
    Note: 'Bấm nút bên dưới để xem Desmos tự giải cả 3 bài trong tích tắc:',
    Presets: [
      {
        label: 'Trang 8 (Bài 1): [f(r), f(2r)] ~ [21, 123]',
        expressions: [
          { id: 'p8_1', latex: 'f(x) = 8x^2 + kx - 17' },
          { id: 'p8_2', latex: '[f(r), f(2r)] \\sim [21, 123]' },
        ],
      },
      {
        label: 'Trang 8 (Bài 2): Vertex Form |a - b| = 152',
        expressions: [
          { id: 'p8_3', latex: 'f(x) = a(x - 4)^2 - 6' },
          { id: 'p8_4', latex: 'f(3) \\sim -8' },
          { id: 'p8_5', latex: 'g(x) = 5f(x)' },
          { id: 'p8_6', latex: '|f(0) - g(0)|' },
        ],
      },
      {
        label: 'Trang 9: Đối xứng bậc 4 => 923',
        expressions: [
          { id: 'p9_1', latex: 'f(x) = a((x + 6)^2 - b)((x + 6)^2 - c)' },
          { id: 'p9_2', latex: 'f([-7, 0]) \\sim [24, 899]' },
          { id: 'p9_3', latex: 'f(-12) + f(-5)' },
        ],
      },
    ],
  },
  {
    page: 'Trang 10 - 11',
    category: 'Solving Systems (Hệ Phương Trình Chứa Tham Số)',
    title: 'Tìm giao điểm hệ phương trình & Hồi quy nghiệm phân số',
    content: `**Bài 1 (Trang 10):** Nghiệm của hệ $10x + 7y = 27$ và $5x + 14y = 45$ là $(\\frac{p}{60}, \\frac{z}{124})$. Tính $z - p$?
- Vẽ 2 đường thẳng tìm giao điểm $(0.6, 3)$, sau đó gõ \`[0.6, 3] ~ [p/60, z/124]\` $\\Rightarrow p = 36, z = 372 \\Rightarrow z - p = 336$.

**Bài 2 (Trang 11):** Hệ $mx + ky = -83$ và $2x + ky = 22$ cắt nhau tại $(5, y)$. Tìm $m$?
- Gán \`x_1 = 5\` rồi gõ \`[m*x_1 + k*y_1, 2x_1 + k*y_1] ~ [-83, 22]\` $\\Rightarrow m = -19$.

**Bài 3 (Trang 11):** Hệ $-x - wy = -411$ và $2x - wy = 81$ cắt nhau tại $(q, 19)$. Tìm $w$?
- Gán \`y_1 = 19\` rồi gõ \`[-x_1 - w*y_1, 2x_1 - w*y_1] ~ [-411, 81]\` $\\Rightarrow w = 13$.`,
    Note: 'Đề cho trước x thì gán x₁ = số đó; đề cho trước y thì gán y₁ = số đó!',
    Presets: [
      {
        label: 'Trang 10: Hệ PT nghiệm phân số z - p = 336',
        expressions: [
          { id: 'p10_1', latex: '10x + 7y = 27' },
          { id: 'p10_2', latex: '5x + 14y = 45' },
          { id: 'p10_3', latex: '[0.6, 3] \\sim [\\frac{p}{60}, \\frac{z}{124}]' },
          { id: 'p10_4', latex: 'z - p' },
        ],
      },
      {
        label: 'Trang 11 (Bài trên): Giao điểm tại x₁ = 5 => m = -19',
        expressions: [
          { id: 'p11_1', latex: 'x_1 = 5' },
          { id: 'p11_2', latex: '[m x_1 + k y_1, 2x_1 + k y_1] \\sim [-83, 22]' },
        ],
      },
      {
        label: 'Trang 11 (Bài dưới): Giao điểm tại y₁ = 19 => w = 13',
        expressions: [
          { id: 'p11_3', latex: 'y_1 = 19' },
          { id: 'p11_4', latex: '[-x_1 - w y_1, 2x_1 - w y_1] \\sim [-411, 81]' },
        ],
      },
    ],
  },
  {
    page: 'Trang 16 - 23',
    category: 'Random(x) Equivalence & Điều Kiện Ràng Buộc {}',
    title: 'Kỹ thuật x₁ = random(100) để đồng nhất 2 biểu thức chứa nhiều biến',
    content: `**Cảnh báo Câu Chống Desmos (Trang 16):** Khi có 3 ẩn $(a, b, c)$ nguyên nhưng đề chỉ cho 2 điểm $(9,0)$ và $(0,27)$ với $f(x) = \\sqrt{x^3+ax^2+bx+c}$, nếu thấy **RMSE = 15.17** (khác 0) tức là thiếu dữ kiện, hãy giải tay: $c = 27^2 = 729$, thế $x=9 \\Rightarrow 9a+b = -162$.

**Bài Phân Thức Có Điều Kiện (Trang 17):** $\\frac{4}{x-3} + \\frac{3}{x+6} = \\frac{px+k}{(x-3)(x+6)}$ với $x > 3, p > 0, k > 0$.
- Cho \`x_1 = [4...10]\` và thêm điều kiện \`{p>0}{k>0}\` $\\Rightarrow p = 7, k = 15 \\Rightarrow pk = 105$.

**Kỹ thuật Random 2 biến (Trang 23):** Tìm $c$ trong $(7x+y)(x+7y)(3x+y) = ax^3 + bx^2y + cxy^2 + dy^3$.
- Cho \`x_1 = random(21)\` và \`y_1 = random(21)\` rồi dùng \`~\` $\\Rightarrow a=21, b=157, c=71, d=7$.`,
    Note: 'Hàm random(100) giúp tạo 100 giá trị ngẫu nhiên để ép 2 biểu thức bằng nhau với mọi x, y!',
    Presets: [
      {
        label: 'Trang 17: Phân thức với x₁ = [4...10] => pk = 105',
        expressions: [
          { id: 'p17_1', latex: 'x_1 = [4...10]' },
          { id: 'p17_2', latex: '\\frac{4}{x_1 - 3} + \\frac{3}{x_1 + 6} \\sim \\frac{p x_1 + k}{(x_1 - 3)(x_1 + 6)} \\{p > 0\\}\\{k > 0\\}' },
          { id: 'p17_3', latex: 'p \\cdot k' },
        ],
      },
      {
        label: 'Trang 23 (Bài 1): Dùng x₁ = random(100) tìm b = 2',
        expressions: [
          { id: 'p23_1', latex: 'x_1 = \\operatorname{random}(100)' },
          { id: 'p23_2', latex: '(3x_1^2 + 4x_1 - 2) - (7x_1^2 - b x_1 + 3) \\sim -4x_1^2 + 6x_1 - 5' },
        ],
      },
      {
        label: 'Trang 23 (Bài 2): Dùng random(21) cho cả x₁ và y₁ => c = 71',
        expressions: [
          { id: 'p23_3', latex: 'x_1 = \\operatorname{random}(21)' },
          { id: 'p23_4', latex: 'y_1 = \\operatorname{random}(21)' },
          { id: 'p23_5', latex: '(7x_1 + y_1)(x_1 + 7y_1)(3x_1 + y_1) \\sim a x_1^3 + b x_1^2 y_1 + c x_1 y_1^2 + d y_1^3' },
        ],
      },
    ],
  },
  {
    page: 'Trang 30 - 39',
    category: 'Table Abuse & No Regression (Đạo Hàm P\'(0) & Min/Max)',
    title: 'Dùng Đạo hàm P\'(0) tìm hệ số b & Quét cực trị đồ thị',
    content: `**Table Abuse (Trang 30):** Cho bảng $(2, 5), (7, 42), (9, 126)$ với $f(x) = \\frac{g(x)-6}{x+4}$ và $g(x) = ab^x + cx$. Tính $g(3)$?
- Nhập mảng $x_1, y_1$ và hồi quy \`y_1 ~ (a*b^x_1 + c*x_1 - 6)/(x_1 + 4)\` $\\Rightarrow a=3, b=2, c=12 \\Rightarrow g(3) = 60$.

**Mẹo Đạo Hàm Không Cần Hồi Quy (Trang 35):** Cho $f(x)=6x+5, g(x)=7x-3, h(x)=3x+2$. Biết $P(x) = f(x)g(x) - h(x) = ax^2 + bx + c$. Tìm $b$?
- Vì $P'(x) = 2ax + b$, nên tại $x = 0$ ta có **$P'(0) = b$**! Chỉ cần gõ \`P'(0)\` là ra ngay \`14\`!

**Tìm Min/Max dịch chuyển đồ thị (Trang 37):** Cho $f(x) = 3x^2 + 48x + 193$ và $g(x) = f(x+7)$. Giá trị nhỏ nhất của $g(x)$ là?
- Gõ trực tiếp 2 dòng và click vào đáy Parabol tại $(-15, 1)$ $\\Rightarrow$ Min $= 1$.`,
    Note: 'Tuyệt chiêu P\'(0) = b và P\'\'(0)/2 = a giúp tìm hệ số bậc hai không cần nhân phá ngoặc!',
    Presets: [
      {
        label: 'Trang 30: Table Abuse tìm g(3) = 60',
        expressions: [
          { id: 'p30_1', latex: 'x_1 = [2, 7, 9]' },
          { id: 'p30_2', latex: 'y_1 = [5, 42, 126]' },
          { id: 'p30_3', latex: 'y_1 \\sim \\frac{a b^{x_1} + c x_1 - 6}{x_1 + 4}' },
          { id: 'p30_4', latex: 'a b^3 + c(3)' },
        ],
      },
      {
        label: 'Trang 35: Tuyệt chiêu Đạo hàm P\'(0) = 14',
        expressions: [
          { id: 'p35_1', latex: 'f(x) = 6x + 5' },
          { id: 'p35_2', latex: 'g(x) = 7x - 3' },
          { id: 'p35_3', latex: 'h(x) = 3x + 2' },
          { id: 'p35_4', latex: 'P(x) = f(x) \\cdot g(x) - h(x)' },
          { id: 'p35_5', latex: 'P\'(0)' },
        ],
      },
      {
        label: 'Trang 37: Tìm Min của g(x) = f(x+7) tại (-15, 1)',
        expressions: [
          { id: 'p37_1', latex: 'f(x) = 3x^2 + 48x + 193' },
          { id: 'p37_2', latex: 'g(x) = f(x + 7)' },
        ],
      },
    ],
  },
  {
    page: 'Trang 40 - 44',
    category: 'Circle, Mean/Range & Percent (% of)',
    title: 'Đường tròn, Trung vị/Khoảng biến thiên & Toán Phần Trăm (% of)',
    content: `**Đường tròn (Trang 41):** Đường tròn $x^2 + ax + y^2 + by + c = 12$ có tâm $(-2, 3)$ và đường kính $10$ ($R = 5$). Tính $a + b + c$?
- Dùng \`random(50)\` đồng nhất phương trình chính tắc $(x_1+2)^2 + (y_1-3)^2 - 25$ với $x_1^2 + ax_1 + y_1^2 + by_1 + c - 12$ $\\Rightarrow a+b+c = -2$.

**Mean, Median, Range (Trang 42):** Dãy tăng dần $a, 26, 29, b, 33, 49, c$ có Mean $= 36$, Median $= 29$, Range $= 72$. Tìm $c$?
- Vì 7 số có trung vị đứng thứ 4 nên $b = 29$; Range $= c - a = 72 \\Rightarrow a = c - 72$. Gõ \`d = [x_1 - 72, 26, 29, 29, 33, 49, x_1]\` và \`mean(d) ~ 36\` $\\Rightarrow x_1 = c = 79$.

**Toán Phần Trăm (Trang 43):** Cho $a$ bằng $2241\\%$ của $(b+c)$, và $b$ bằng $83\\%$ của $c$. Hỏi $a$ bằng bao nhiêu phần trăm của $b$?
- Desmos hiểu trực tiếp chữ \`% of\`! Gõ \`[a, b, d% of b] ~ [2241% of (b+c), 83% of c, a]\` $\\Rightarrow d = 4941\\%$.`,
    Note: 'Trong Desmos bạn có thể gõ trực tiếp chữ "% of" (ví dụ: 83% of c) cực kỳ tiện lợi!',
    Presets: [
      {
        label: 'Trang 41: Đồng nhất Đường tròn => a+b+c = -2',
        expressions: [
          { id: 'p41_1', latex: 'x_1 = \\operatorname{random}(50)' },
          { id: 'p41_2', latex: 'y_1 = \\operatorname{random}(50)' },
          { id: 'p41_3', latex: '(x_1 + 2)^2 + (y_1 - 3)^2 - 25 \\sim x_1^2 + a x_1 + y_1^2 + b y_1 + c - 12' },
          { id: 'p41_4', latex: 'a + b + c' },
        ],
      },
      {
        label: 'Trang 42: Mean(d) ~ 36 => c = 79',
        expressions: [
          { id: 'p42_1', latex: 'd = [x_1 - 72, 26, 29, 29, 33, 49, x_1]' },
          { id: 'p42_2', latex: '\\operatorname{mean}(d) \\sim 36' },
        ],
      },
      {
        label: 'Trang 43: Giải toán % bằng lệnh "% of" => 4941%',
        expressions: [
          { id: 'p43_1', latex: 'c = 1' },
          { id: 'p43_2', latex: 'b = 83\\% \\operatorname{of} c' },
          { id: 'p43_3', latex: 'a = 2241\\% \\operatorname{of} (b + c)' },
          { id: 'p43_4', latex: 'd\\% \\operatorname{of} b \\sim a' },
        ],
      },
    ],
  },
];

const UNIVERSITY_BENCHMARKS = [
  {
    name: 'ĐH Bách Khoa Hà Nội (HUST) - Khoa học Máy tính (IT1) / IT-E10',
    minScore: 1530,
    safeScore: 1560,
  },
  {
    name: 'ĐH Ngoại Thương (FTU) - Kinh tế Đối ngoại / Logistics',
    minScore: 1480,
    safeScore: 1520,
  },
  {
    name: 'ĐH Kinh Tế Quốc Dân (NEU) - Phân tích Dữ liệu / Tài chính',
    minScore: 1420,
    safeScore: 1480,
  },
  {
    name: 'ĐH Công Nghệ - ĐHQGHN (UET) - Trí tuệ Nhân tạo (AI) / CNTT',
    minScore: 1460,
    safeScore: 1510,
  },
];

export default function DesmosSimPage() {
  const [activeTab, setActiveTab] = useState('desmos_lab'); // 'desmos_lab' | 'score_simulator'

  // Chế độ bên cột trái: 'interactive_book' (Sổ tay trích xuất 44 trang) | 'pdf_viewer' (Trình đọc file PDF trực tiếp)
  const [leftViewMode, setLeftViewMode] = useState('interactive_book');
  const [pdfUrl, setPdfUrl] = useState('/Math desmos_Key.pdf');
  const [pdfFileName, setPdfFileName] = useState('Math desmos_Key.pdf');
  const fileInputRef = useRef(null);

  const [isDesmosOpen, setIsDesmosOpen] = useState(true);
  const [desmosWidth, setDesmosWidth] = useState(() => Math.round(window.innerWidth * 0.48));
  const [injectedExpressions, setInjectedExpressions] = useState(
    DESMOS_PDF_PAGES[0].Presets[0].expressions
  );
  const [currentPageIdx, setCurrentPageIdx] = useState(0);

  // State cho Tab 2: Máy giả lập điểm số SAT IRT
  const [rwM1, setRwM1] = useState(25);
  const [rwM2, setRwM2] = useState(24);
  const [mathM1, setMathM1] = useState(21);
  const [mathM2, setMathM2] = useState(21);

  const handleUploadPdf = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setPdfUrl(objectUrl);
    setPdfFileName(file.name);
    setLeftViewMode('pdf_viewer');
  };

  const handleLoadRecipeToDesmos = (expressions) => {
    setInjectedExpressions([...expressions]);
    setIsDesmosOpen(true);
  };

  const simResult = useMemo(() => {
    const rwRouteHard = rwM1 >= 18;
    const mathRouteHard = mathM1 >= 15;

    const rwRawRatio = (rwM1 * 1.15 + rwM2 * 1.0) / (27 * 2.15);
    let rwScaled = Math.round((200 + rwRawRatio * 600) / 10) * 10;
    if (!rwRouteHard) rwScaled = Math.min(610, rwScaled);
    if (rwM1 === 27 && rwM2 === 27) rwScaled = 800;

    const mathRawRatio = (mathM1 * 1.15 + mathM2 * 1.0) / (22 * 2.15);
    let mathScaled = Math.round((200 + mathRawRatio * 600) / 10) * 10;
    if (!mathRouteHard) mathScaled = Math.min(620, mathScaled);
    if (mathM1 === 22 && mathM2 === 22) mathScaled = 800;

    const totalScore = rwScaled + mathScaled;
    const percentile =
      totalScore >= 1530
        ? 'Top 1% Toàn Cầu (99th+)'
        : totalScore >= 1450
        ? 'Top 3% Toàn Cầu (97th)'
        : totalScore >= 1350
        ? 'Top 8% Toàn Cầu (92nd)'
        : 'Top 20% Toàn Cầu';

    return {
      rwScaled,
      mathScaled,
      totalScore,
      rwRouteHard,
      mathRouteHard,
      percentile,
    };
  }, [rwM1, rwM2, mathM1, mathM2]);

  // Căn lề phải cho TOÀN BỘ khung trang (gồm cả Header) để không bao giờ bị máy tính Desmos đè lên chữ
  const containerRightMargin =
    activeTab === 'desmos_lab' && isDesmosOpen ? `${desmosWidth + 16}px` : '0px';

  return (
    <div
      style={{
        marginRight: containerRightMargin,
        transition: 'margin-right 0.12s ease-out',
      }}
      className="min-h-full bg-[#060913] text-slate-100 p-5 lg:p-7 space-y-5 select-none font-sans relative overflow-x-hidden"
    >
      {/* HEADER TỰ ĐỘNG CO GIÃN THEO CHIỀU NGANG CỦA DESMOS (KHÔNG BỊ CHE CHỮ) */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-indigo-500/20 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-[10px] font-mono font-bold uppercase tracking-widest mb-1.5">
            <Sparkles className="w-3 h-3" /> DESMOS HACK - KEY (44 PAGES) & SCORE SIMULATOR
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Bí Kíp Giải Desmos Chinh Phục 800 SAT Math
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Đọc trực tiếp tài liệu PDF bên trái và thực hành bấm máy Desmos ngay bên phải màn hình.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-slate-950/90 p-1 rounded-2xl border border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('desmos_lab')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'desmos_lab'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>1. Tài Liệu Desmos Hack</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('score_simulator');
              setIsDesmosOpen(false);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'score_simulator'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>2. Dự Báo Điểm & Đại Học</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: ĐỌC FILE PDF "Math desmos_Key.pdf" BÊN TRÁI + THỬ DESMOS BÊN PHẢI */}
      {/* ===================================================================== */}
      {activeTab === 'desmos_lab' && (
        <div className="space-y-4">
          {/* Thanh chuyển đổi chế độ đọc: Sổ tay tương tác 44 trang vs Xem PDF gốc */}
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-cyan-400/30 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setLeftViewMode('interactive_book')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
                  leftViewMode === 'interactive_book'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Sổ Tay Tương Tác (44 Trang PDF)</span>
              </button>

              <button
                type="button"
                onClick={() => setLeftViewMode('pdf_viewer')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
                  leftViewMode === 'pdf_viewer'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Xem File PDF Gốc</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleUploadPdf}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Chọn file Math desmos_Key.pdf từ máy tính của bạn để đọc trực tiếp"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Chọn file PDF từ máy</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsDesmosOpen(!isDesmosOpen)}
              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer transition"
            >
              {isDesmosOpen ? 'Ẩn Desmos' : 'Mở Máy Tính Desmos'}
            </button>
          </div>

          {/* CHẾ ĐỘ A: TRÌNH ĐỌC FILE PDF TRỰC TIẾP (NHÚNG NGUYÊN BẢN PDF) */}
          {leftViewMode === 'pdf_viewer' && (
            <div className="rounded-3xl bg-slate-900 border border-cyan-400/35 overflow-hidden shadow-2xl flex flex-col h-[calc(100vh-210px)] min-h-[560px]">
              <div className="px-4 py-2.5 bg-slate-950 border-b border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-bold text-cyan-300">
                  <FileText className="w-4 h-4" />
                  <span>Đang mở: {pdfFileName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] font-bold text-amber-300 hover:underline cursor-pointer"
                >
                  Đổi file PDF khác...
                </button>
              </div>

              <iframe
                src={pdfUrl}
                title="Math Desmos Key PDF Viewer"
                className="w-full flex-1 bg-slate-950 border-0"
              />
            </div>
          )}

          {/* CHẾ ĐỘ B: SỔ TAY TƯƠNG TÁC TRÍCH XUẤT 44 TRANG TỪ "Math desmos_Key.pdf" */}
          {leftViewMode === 'interactive_book' && (
            <div className="space-y-4">
              {/* Thanh chọn nhanh cụm trang trong cuốn PDF */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {DESMOS_PDF_PAGES.map((sec, idx) => (
                  <button
                    key={sec.page}
                    type="button"
                    onClick={() => setCurrentPageIdx(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
                      currentPageIdx === idx
                        ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 font-extrabold'
                        : 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {sec.page}
                  </button>
                ))}
              </div>

              {/* Nội dung chi tiết của Trang PDF đang chọn */}
              {DESMOS_PDF_PAGES.map((section, idx) => {
                if (idx !== currentPageIdx) return null;
                return (
                  <div
                    key={section.page}
                    className="p-6 rounded-3xl bg-slate-900/90 border border-cyan-400/30 space-y-5 shadow-xl"
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold uppercase">
                          {section.page} • {section.category}
                        </span>
                        <h2 className="text-lg font-black text-white mt-1.5">
                          {section.title}
                        </h2>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          disabled={currentPageIdx === 0}
                          onClick={() => setCurrentPageIdx((p) => Math.max(0, p - 1))}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/15 disabled:opacity-30 text-white cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={currentPageIdx === DESMOS_PDF_PAGES.length - 1}
                          onClick={() =>
                            setCurrentPageIdx((p) =>
                              Math.min(DESMOS_PDF_PAGES.length - 1, p + 1)
                            )
                          }
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/15 disabled:opacity-30 text-white cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Nội dung bài toán & hướng dẫn từ PDF */}
                    <div className="text-sm text-slate-200 leading-relaxed space-y-3 bg-slate-950/70 p-5 rounded-2xl border border-white/10">
                      <MathRenderer text={section.content} />
                    </div>

                    {/* Lưu ý quan trọng từ tác giả file PDF */}
                    {section.Note && (
                      <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-400/35 text-xs text-amber-200 flex items-center gap-2.5 font-medium">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>{section.Note}</span>
                      </div>
                    )}

                    {/* Các nút Bấm 1-Click nạp thẳng dòng lệnh của Trang PDF sang máy tính Desmos bên phải */}
                    <div className="space-y-2.5 pt-2">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-300 block">
                        ⚡ BẤM ĐỂ THỬ TRỰC TIẾP TRÊN MÁY TÍNH DESMOS BÊN PHẢI:
                      </span>
                      <div className="grid grid-cols-1 gap-2.5">
                        {section.Presets.map((preset, pIdx) => (
                          <div
                            key={pIdx}
                            className="p-3.5 rounded-2xl bg-slate-950/90 border border-white/10 hover:border-cyan-400/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                          >
                            <div className="space-y-1">
                              <div className="text-xs font-extrabold text-white">
                                {preset.label}
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {preset.expressions.map((exp) => (
                                  <code
                                    key={exp.id}
                                    className="px-2 py-0.5 rounded bg-white/5 text-[11px] font-mono text-amber-300"
                                  >
                                    {exp.latex}
                                  </code>
                                ))}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleLoadRecipeToDesmos(preset.expressions)}
                              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer transition shadow-md shadow-cyan-500/20"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Thử trên Desmos</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* MÁY TÍNH DESMOS BÊN PHẢI */}
          <DesmosModal
            isOpen={isDesmosOpen}
            onClose={() => setIsDesmosOpen(false)}
            initialExpressions={injectedExpressions}
            onWidthChange={(w) => setDesmosWidth(w)}
          />
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: MÁY GIẢ LẬP ĐIỂM SỐ & XÉT TUYỂN ĐẠI HỌC */}
      {/* ===================================================================== */}
      {activeTab === 'score_simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 p-6 rounded-3xl bg-slate-900/85 border border-white/10 space-y-6">
            <div className="border-b border-white/10 pb-3">
              <h3 className="text-base font-extrabold text-white">
                Điều Chỉnh Số Câu Đúng Từng Module (IRT Adaptive Curve)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Kéo các thanh trượt bên dưới để xem thuật toán quy đổi điểm số.
              </p>
            </div>

            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-cyan-300">Reading & Writing — Module 1</span>
                  <span className="font-mono text-sm text-white">{rwM1} / 27 câu</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={27}
                  value={rwM1}
                  onChange={(e) => setRwM1(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-cyan-300">Reading & Writing — Module 2</span>
                  <span className="font-mono text-sm text-white">{rwM2} / 27 câu</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={27}
                  value={rwM2}
                  onChange={(e) => setRwM2(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-indigo-300">Mathematics — Module 1</span>
                  <span className="font-mono text-sm text-white">{mathM1} / 22 câu</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={22}
                  value={mathM1}
                  onChange={(e) => setMathM1(Number(e.target.value))}
                  className="w-full accent-indigo-400 cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-indigo-300">Mathematics — Module 2</span>
                  <span className="font-mono text-sm text-white">{mathM2} / 22 câu</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={22}
                  value={mathM2}
                  onChange={(e) => setMathM2(Number(e.target.value))}
                  className="w-full accent-indigo-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900/90 via-slate-900 to-slate-950 border border-cyan-400/40 shadow-2xl text-center space-y-4">
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 font-mono text-[10px] font-bold uppercase tracking-widest">
                ESTIMATED TOTAL SAT SCORE
              </span>
              <div className="text-6xl font-black font-mono text-white tracking-tight">
                {simResult.totalScore}
              </div>
              <div className="text-xs font-bold text-amber-300">{simResult.percentile}</div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-white/[0.06] border border-white/10">
                  <span className="text-[10px] font-mono text-slate-400 block">RW</span>
                  <span className="text-xl font-black font-mono text-cyan-300">{simResult.rwScaled}</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/[0.06] border border-white/10">
                  <span className="text-[10px] font-mono text-slate-400 block">MATH</span>
                  <span className="text-xl font-black font-mono text-indigo-300">{simResult.mathScaled}</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/85 border border-white/10 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <GraduationCap className="w-5 h-5 text-cyan-400" />
                <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  Dự Báo Xét Tuyển Đại Học Top Đầu
                </h4>
              </div>
              <div className="space-y-3">
                {UNIVERSITY_BENCHMARKS.map((uni) => {
                  const isSafe = simResult.totalScore >= uni.safeScore;
                  const isCompetitive = simResult.totalScore >= uni.minScore;
                  return (
                    <div
                      key={uni.name}
                      className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-white">{uni.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                            isSafe
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : isCompetitive
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {isSafe
                            ? 'Đỗ An Toàn Cao'
                            : isCompetitive
                            ? 'Cạnh Tranh Tốt'
                            : `Cần +${uni.minScore - simResult.totalScore}đ`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}