import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Copy,
  Check,
  X,
  ListOrdered,
} from 'lucide-react';
import MathRenderer from '../common/MathRenderer';

/* -------------------------------------------------------------------------- */
/* Hằng số                                                                    */
/* -------------------------------------------------------------------------- */
const ANALYZING_DURATION_MS = 800;
const TOAST_DURATION_MS = 2200;
const COLLAPSE_THRESHOLD = 240;
const ANALYZING_MESSAGES = [
  'Đang quét đề bài…',
  'Nhận diện dạng bài và bẫy…',
  'Đối chiếu đáp án của bạn…',
];
const NEGATION_RE = /\b(NOT|EXCEPT|LEAST)\b/;
const EXTREME_RE =
  /\b(always|never|only|all|none|completely|entirely|totally|solely|every|impossible|definitely|absolutely)\b/i;
const MATH_RE = /algebra|math|problem-solving|data analysis|geometry|trigonometry|toán/i;
const VERBAL_RE = /craft|structure|information|ideas|conventions|expression|reading|writing|verbal/i;
const DIFFICULTY_META = {
  easy: { label: 'Dễ', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  medium: { label: 'Trung bình', className: 'bg-amber-50 text-amber-700 ring-amber-200' },
  hard: { label: 'Khó', className: 'bg-rose-50 text-rose-700 ring-rose-200' },
};

/* -------------------------------------------------------------------------- */
/* Kho nội dung phân tích                                                     */
/* -------------------------------------------------------------------------- */
const TRAPS = {
  sign: {
    tag: 'Bẫy quên đổi dấu',
    body: [
      'Giá trị bạn chọn đúng bằng số đối của đáp án chính thức. Đây là dấu vết điển hình của việc quên đổi dấu khi chuyển vế, hoặc khi nhân/chia hai vế cho một số âm.',
      'Người ra đề biết lỗi này rất phổ biến nên thường đặt sẵn một phương án "trái dấu" để bắt những ai làm nhanh mà không kiểm tra lại.',
    ],
    takeaway:
      'Mỗi lần chuyển vế hoặc nhân/chia với số âm, hãy khoanh tròn dấu rồi thay đáp án vào đề để kiểm tra trước khi chọn.',
  },
  forgotHalf: {
    tag: 'Bẫy thiếu bước chia đôi',
    body: [
      String.raw`Giá trị bạn chọn gấp đôi đáp án đúng. Lỗi này thường gặp khi dừng ở đường kính thay vì bán kính, hoặc quên nhân với $\frac{1}{2}$ trong các công thức như diện tích tam giác $A = \frac{1}{2}bh$.`,
    ],
    takeaway:
      'Trước khi chốt, tự hỏi: đề cho bán kính hay đường kính, và mình đã nhân hoặc chia $2$ đủ số lần chưa?',
  },
  forgotDouble: {
    tag: 'Bẫy thiếu bước nhân đôi',
    body: [
      'Giá trị bạn chọn bằng một nửa đáp án đúng. Có thể bạn đã bỏ sót hệ số $2$ (ví dụ khi khai triển $(x + a)^2 = x^2 + 2ax + a^2$), hoặc nhầm đường kính với bán kính.',
    ],
    takeaway:
      'Trước khi chốt, tự hỏi: đề cho bán kính hay đường kính, và mình đã nhân hoặc chia $2$ đủ số lần chưa?',
  },
  reciprocal: {
    tag: 'Bẫy đảo ngược tỉ lệ',
    body: [
      String.raw`Giá trị bạn chọn là nghịch đảo của đáp án đúng. Lỗi này hay xảy ra khi đặt tỉ lệ ngược (ví dụ $\frac{a}{b}$ thay vì $\frac{b}{a}$), tức là nhầm đại lượng nào là tử, đại lượng nào là mẫu.`,
    ],
    takeaway:
      'Nói thành lời tỉ lệ cần lập ("A trên B") rồi mới viết phân số; tử và mẫu phải đúng thứ tự mà đề nêu.',
  },
  rounding: {
    tag: 'Bẫy làm tròn sớm',
    body: [
      'Đáp án của bạn rất gần đáp án đúng, nghĩa là hướng giải đúng nhưng sai số phát sinh ở bước cuối. Nguyên nhân thường là làm tròn giữa chừng hoặc đổi phân số sang số thập phân quá sớm.',
    ],
    takeaway: 'Giữ nguyên phân số hoặc căn thức đến bước cuối cùng; chỉ làm tròn khi đề yêu cầu.',
  },
  offByOne: {
    tag: 'Bẫy lệch một đơn vị',
    body: [
      'Đáp án của bạn lệch đúng $1$ so với đáp án chính thức. Đây là dấu hiệu của lỗi đếm mút (đếm thừa hoặc thiếu một phần tử), hoặc nhầm giữa "lớn hơn" và "lớn hơn hoặc bằng".',
    ],
    takeaway:
      'Gặp bài đếm số hạng hoặc bất đẳng thức, hãy thử lại với một ví dụ nhỏ (như $n = 2$) để kiểm tra có bị lệch $1$ hay không.',
  },
  algebra: {
    tag: 'Bẫy dừng giữa chừng',
    body: [
      'Đề Algebra thường đặt sẵn các phương án ứng với kết quả trung gian, ví dụ bạn giải ra $x$ nhưng câu hỏi lại hỏi giá trị của $2x + 1$. Rất có thể bạn đã trả lời cho một đại lượng khác với đại lượng đề yêu cầu.',
      'Một lỗi khác cũng hay gặp là bỏ sót điều kiện của đề (ví dụ "$x$ là số nguyên dương") nên chọn nghiệm không hợp lệ.',
    ],
    common:
      'Ở dạng Algebra, đề thường đặt sẵn phương án cho kết quả trung gian (ví dụ giải ra $x$ nhưng câu hỏi hỏi $2x + 1$) và kèm điều kiện dễ bỏ sót.',
    takeaway:
      'Khoanh tròn đại lượng cần tìm ngay từ đầu, và trước khi chọn đáp án hãy đọc lại câu hỏi một lần nữa để chắc mình trả lời đúng đại lượng đó.',
  },
  advanced: {
    tag: 'Bẫy khai triển và lũy thừa',
    body: [
      'Ở dạng Advanced Math, phương án sai thường là hệ quả của việc khai triển sai $(x + a)^2$ thành $x^2 + a^2$, bỏ sót nghiệm âm khi lấy căn, hoặc đọc ngược dấu của đỉnh parabol $y = a(x - h)^2 + k$ (đỉnh là $(h, k)$, không phải $(-h, k)$).',
    ],
    common:
      'Ở dạng Advanced Math, các bẫy quen thuộc là khai triển sai $(x + a)^2$, bỏ sót nghiệm âm khi lấy căn và đọc ngược dấu của đỉnh parabol.',
    takeaway:
      'Với hàm bậc hai và hàm mũ, hãy kiểm tra kết quả bằng cách thay một giá trị $x$ cụ thể (hoặc vẽ Desmos) thay vì tin vào chuỗi biến đổi đại số dài.',
  },
  psda: {
    tag: 'Bẫy mẫu số và dữ kiện',
    body: [
      'Các phương án sai ở dạng này thường đến từ việc lấy nhầm mẫu số (toàn bộ so với nhóm con), nhầm phần trăm với phần trăm thay đổi, hoặc đọc sai đơn vị và trục của bảng, biểu đồ.',
    ],
    common:
      'Ở dạng Problem-Solving and Data Analysis, các bẫy quen thuộc là lấy nhầm mẫu số, nhầm phần trăm với phần trăm thay đổi và đọc sai đơn vị hoặc trục biểu đồ.',
    takeaway:
      'Trước khi tính, hãy nói thành lời "phần" là gì và "tổng" là gì; sau đó kiểm tra đơn vị và tiêu đề trục.',
  },
  geometry: {
    tag: 'Bẫy đơn vị và công thức hình học',
    body: [
      String.raw`Các phương án sai thường ứng với việc nhầm bán kính với đường kính, diện tích với chu vi, độ với radian, hoặc dùng ngược tỉ số lượng giác ($\sin$ thay cho $\cos$).`,
    ],
    common:
      'Ở dạng Geometry and Trigonometry, các bẫy quen thuộc là nhầm bán kính với đường kính, diện tích với chu vi, và độ với radian.',
    takeaway: String.raw`Vẽ hình và ghi số đo lên hình trước; sau khi có kết quả, kiểm tra độ hợp lý (cạnh huyền dài nhất, tổng ba góc bằng $180^\circ$).`,
  },
  mathGeneral: {
    tag: 'Bẫy đọc lướt đề',
    body: [
      'Đáp án bạn chọn rất có thể là kết quả của một bước trung gian, hoặc trả lời cho đại lượng khác với đại lượng đề yêu cầu. SAT Math luôn đặt sẵn các phương án như vậy để bắt lỗi đọc lướt.',
    ],
    common:
      'Ở SAT Math, bẫy quen thuộc là phương án ứng với kết quả trung gian hoặc với một đại lượng khác đề yêu cầu.',
    takeaway: 'Đọc câu hỏi cuối cùng hai lần và gạch chân đại lượng cần tìm trước khi tính.',
  },
  negation: {
    tag: 'Bẫy từ khóa phủ định',
    body: [
      'Câu hỏi chứa từ khóa phủ định (NOT, EXCEPT hoặc LEAST), nghĩa là ba phương án đúng với đoạn văn và chỉ một phương án sai. Khi đọc lướt, não tự động tìm phương án "đúng", và phương án bạn chọn rất có thể là một phương án đúng với đoạn văn.',
    ],
    takeaway:
      'Thấy NOT, EXCEPT hoặc LEAST, hãy ghi ngay chữ T/F cạnh từng phương án; đáp án là phương án duy nhất khác loại với ba phương án còn lại.',
  },
  extreme: {
    tag: 'Bẫy phương án cực đoan',
    body: [
      'Phương án bạn chọn chứa từ mang tính tuyệt đối (như always, never, only, all). Đoạn văn hiếm khi khẳng định mạnh đến mức đó, nên đây là kiểu nhiễu quen thuộc của College Board.',
      'Chỉ cần một ngoại lệ trong đoạn văn là phương án cực đoan sai hoàn toàn, dù phần còn lại nghe rất hợp lý.',
    ],
    takeaway:
      'Phương án chứa always, never, only hoặc all thường sai, trừ khi đoạn văn khẳng định đúng mức độ đó.',
  },
  echo: {
    tag: 'Bẫy lặp từ trong đoạn văn',
    body: [
      'Phương án bạn chọn dùng lại nhiều từ giống hệt đoạn văn nên tạo cảm giác "có bằng chứng". Đây là mồi nhử: nội dung có thể bị đảo ý, sai phạm vi, hoặc chỉ nhắc chi tiết mà không trả lời câu hỏi.',
      'Đáp án đúng thường diễn đạt lại ý bằng từ khác (paraphrase) chứ không sao chép nguyên văn.',
    ],
    takeaway:
      'Đừng chọn phương án chỉ vì nó lặp từ trong đoạn văn; hãy kiểm tra xem nó có trả lời đúng câu hỏi hay không.',
  },
  craft: {
    tag: 'Bẫy nghĩa quen thuộc và sắc thái',
    body: [
      'Ở dạng Craft and Structure, phương án sai thường là từ có nghĩa quen thuộc nhưng sai sắc thái (tích cực hay tiêu cực) hoặc sai ngữ cảnh, hoặc một chức năng nghe hợp lý nhưng không đúng vai trò của phần được hỏi trong đoạn.',
    ],
    common:
      'Ở dạng Craft and Structure, bẫy quen thuộc là từ có nghĩa quen thuộc nhưng sai sắc thái hoặc sai ngữ cảnh.',
    takeaway:
      'Đoán trước ý nghĩa cần điền hoặc chức năng của phần được hỏi rồi mới nhìn đáp án; đừng để phương án dẫn dắt bạn.',
  },
  info: {
    tag: 'Bẫy ngoài phạm vi và suy diễn quá đà',
    body: [
      'Ở dạng Information and Ideas, phương án sai thường đúng về kiến thức chung nhưng không có bằng chứng trong đoạn, hoặc suy diễn đi xa hơn những gì tác giả nói.',
    ],
    common:
      'Ở dạng Information and Ideas, bẫy quen thuộc là phương án đúng về kiến thức chung nhưng không có bằng chứng trong đoạn văn.',
    takeaway:
      'Không chỉ ra được câu bằng chứng trong đoạn văn thì không chọn, dù phương án nghe hợp lý đến đâu.',
  },
  conventions: {
    tag: 'Bẫy "nghe có vẻ đúng"',
    body: [
      'Ở dạng Standard English Conventions, phương án sai thường "nghe xuôi tai" khi đọc thầm vì cách nói đời thường khác với quy tắc viết chuẩn, đặc biệt là dấu phẩy nối hai mệnh đề độc lập, hoặc chủ ngữ và động từ bị ngăn cách bởi một cụm xen giữa.',
    ],
    common:
      'Ở dạng Standard English Conventions, bẫy quen thuộc là phương án "nghe xuôi tai" nhưng vi phạm quy tắc dấu câu hoặc hòa hợp chủ-vị.',
    takeaway:
      'Chọn theo quy tắc, không chọn theo cảm giác: xác định ranh giới mệnh đề rồi áp dụng quy tắc dấu câu hoặc hòa hợp chủ-vị.',
  },
  expression: {
    tag: 'Bẫy sai quan hệ logic hoặc mục tiêu',
    body: [
      'Ở dạng Expression of Ideas, phương án sai thường đúng về thông tin nhưng không phục vụ mục tiêu mà đề yêu cầu, hoặc dùng từ nối chỉ sai quan hệ (tương phản thay vì bổ sung, nguyên nhân thay vì kết quả).',
    ],
    common:
      'Ở dạng Expression of Ideas, bẫy quen thuộc là phương án đúng thông tin nhưng sai mục tiêu diễn đạt hoặc sai quan hệ logic.',
    takeaway: 'Gọi tên quan hệ logic hoặc mục tiêu diễn đạt trước, rồi mới chọn phương án khớp với nó.',
  },
  verbalGeneral: {
    tag: 'Bẫy nghe hợp lý',
    body: [
      'Phương án bạn chọn nghe hợp lý nhưng không được đoạn văn hỗ trợ đầy đủ. Reading and Writing thường đặt phương án "đúng một nửa" để bắt lỗi chọn theo cảm giác.',
    ],
    common:
      'Ở phần Reading and Writing, bẫy quen thuộc là phương án nghe hợp lý nhưng không có bằng chứng đầy đủ trong đoạn văn.',
    takeaway: 'Mỗi lựa chọn phải chỉ ra được bằng chứng cụ thể trong đoạn; không có bằng chứng thì loại.',
  },
  skipped: {
    tag: 'Chưa chọn đáp án',
    body: [
      'Bạn chưa chọn đáp án cho câu này. Digital SAT không trừ điểm khi trả lời sai, nên bỏ trống luôn kém hơn một lần đoán có cơ sở.',
      'Nếu sắp hết thời gian, hãy loại hai phương án sai rõ ràng rồi chọn một trong hai phương án còn lại.',
    ],
    takeaway:
      'Digital SAT không trừ điểm sai: luôn chọn một đáp án, ít nhất là sau khi đã loại được phương án sai.',
  },
};

const DIFFICULTY_NOTES = {
  easy: 'Đây là câu dễ nên sai ở đây thường do đọc vội hoặc chủ quan chứ không phải thiếu kiến thức; hãy dành thêm vài giây kiểm tra lại trước khi chuyển câu.',
  medium:
    'Câu ở mức trung bình thường chứa đúng một "cái bẫy" được thiết kế sẵn, đủ để đánh lừa người làm nhanh.',
  hard: 'Câu khó thường có ít nhất một phương án được thiết kế riêng cho đúng lỗi này, nên việc mắc bẫy ở đây là bình thường và hoàn toàn khắc phục được.',
};

const STRATEGIES = {
  algebra: {
    headline: 'Dùng đồ thị hoặc thay ngược thay cho biến đổi dài',
    tips: [
      'Nhập từng phương trình vào Desmos: giao điểm của hai đồ thị cho nghiệm của hệ ngay lập tức.',
      'Nếu đề hỏi giá trị của một biểu thức (ví dụ $2x + 1$), hãy thay nghiệm vào biểu thức thay vì dừng ở $x$.',
    ],
  },
  advanced: {
    headline: 'Để Desmos tìm nghiệm và đỉnh giúp bạn',
    tips: [
      'Nhập hàm vào Desmos: nghiệm là giao điểm với trục $x$, đỉnh parabol là điểm cực trị mà Desmos tự đánh dấu.',
      'Khi các phương án là biểu thức, gán một giá trị nhỏ như $x = 2$ vào đề và từng phương án, rồi loại phương án cho kết quả khác.',
    ],
  },
  psda: {
    headline: 'Xác định mẫu số trước, tính sau',
    tips: [
      'Gạch chân nhóm mà đề hỏi (đó chính là mẫu số) trước khi tính bất cứ thứ gì.',
      'Đọc tiêu đề trục và đơn vị của bảng, biểu đồ; ước lượng bằng mắt để loại phương án phi lý.',
      'Với dữ liệu hai biến, nhập bảng vào Desmos để lấy đường hồi quy thay vì tính tay.',
    ],
  },
  geometry: {
    headline: 'Vẽ hình, ghi số đo, kiểm tra độ hợp lý',
    tips: [
      'Vẽ nhanh hình và ghi số đo đã cho lên hình; phần lớn lỗi hình học bắt nguồn từ việc không vẽ.',
      'Với đường tròn hoặc đường thẳng trên mặt phẳng tọa độ, nhập phương trình vào Desmos để kiểm tra giao điểm và khoảng cách.',
      String.raw`Kiểm tra tính hợp lý của kết quả: cạnh huyền dài nhất, tổng ba góc bằng $180^\circ$.`,
    ],
  },
  mathGeneral: {
    headline: 'Đồ thị và thay ngược trước, đại số sau',
    tips: [
      'Nhập phương trình hoặc hàm số vào Desmos để tìm nghiệm bằng đồ thị thay vì biến đổi dài.',
      'Gán thử một giá trị nhỏ cho biến để kiểm tra nhanh các phương án dạng biểu thức.',
    ],
  },
  craft: {
    headline: 'Đoán trước, rồi loại trừ',
    tips: [
      'Che các đáp án, tự nghĩ ra từ hoặc ý cần điền, sau đó chọn phương án gần nhất với dự đoán.',
      'Khoanh các từ nối (however, therefore, although): chúng quyết định quan hệ giữa các ý.',
      'Loại ngay hai phương án sai sắc thái (tích cực hay tiêu cực) hoặc sai phạm vi, khi đó bạn chỉ còn phải chọn giữa hai phương án.',
    ],
  },
  info: {
    headline: 'Quay lại đoạn văn để tìm bằng chứng',
    tips: [
      'Đọc câu hỏi trước rồi mới đọc đoạn văn, để biết mình đang tìm bằng chứng cho điều gì.',
      'Mỗi phương án phải chỉ ra được một câu trong đoạn làm bằng chứng; không chỉ ra được thì loại.',
      'Loại hai phương án nói quá, ngoài phạm vi hoặc đảo ngược ý của tác giả.',
    ],
  },
  conventions: {
    headline: 'Chọn theo quy tắc, không theo cảm giác',
    tips: [
      'Chỉ đọc câu chứa chỗ trống và xác định ranh giới mệnh đề trước khi nhìn đáp án.',
      'Nhớ ba nhóm lỗi hay gặp: dấu câu nối mệnh đề, hòa hợp chủ-vị, và thì của động từ.',
      'Loại hai phương án vi phạm cùng một quy tắc, thường chỉ còn hai phương án để so sánh.',
    ],
  },
  expression: {
    headline: 'Gọi tên mục tiêu trước khi nhìn đáp án',
    tips: [
      'Xác định mục tiêu mà đề yêu cầu (nối ý, tóm tắt, nhấn mạnh, so sánh) rồi chọn phương án phục vụ đúng mục tiêu đó.',
      'Với câu chuyển tiếp, gọi tên quan hệ (tương phản, nguyên nhân, bổ sung) trước khi nhìn từ nối.',
      'Chỉ dùng thông tin có trong ghi chú của đề; loại phương án thêm thông tin ngoài.',
    ],
  },
  verbalGeneral: {
    headline: 'Loại hai phương án sai rõ ràng trước',
    tips: [
      'Loại ngay các phương án sai phạm vi, sai sắc thái hoặc không có bằng chứng trong đoạn.',
      'Khi còn hai phương án, chọn phương án bám sát đoạn văn hơn, không phải phương án nghe hay hơn.',
    ],
  },
};

const GRID_IN_TIP =
  'Câu điền số không có phương án để thử, nên hãy thay kết quả ngược lại vào đề. Digital SAT nhận cả phân số lẫn số thập phân, tối đa 5 ký tự (6 ký tự nếu là số âm).';
const BACKSOLVE_TIP =
  'Bốn phương án đều là số, nên bạn có thể thay ngược từng phương án vào đề, bắt đầu từ B hoặc C, để loại nhanh.';
const NEGATION_TIP =
  'Câu hỏi có NOT, EXCEPT hoặc LEAST: ghi T/F cạnh từng phương án, đáp án là phương án duy nhất khác loại với ba phương án còn lại.';
const HARD_TIP =
  'Câu khó: nếu sau khoảng 1 đến 1,5 phút vẫn chưa có hướng, hãy đánh dấu (flag) và quay lại sau để không mất thời gian của cả module.';
const EASY_TIP =
  'Câu dễ: mục tiêu là làm nhanh và chắc; đừng nghi ngờ quá mức đáp án đã kiểm tra được.';

/* -------------------------------------------------------------------------- */
/* Hàm tiện ích                                                               */
/* -------------------------------------------------------------------------- */
const toText = (value) => (value === null || value === undefined ? '' : String(value).trim());
const normalizeKey = (value) => toText(value).toLowerCase().replace(/[\s$]/g, '');

const parseNumeric = (raw) => {
  if (raw === null || raw === undefined) return null;
  const s = String(raw)
    .replace(/\$/g, '')
    .replace(/\s+/g, '')
    .replace(/,/g, '')
    .replace(/\u2212/g, '-')
    .replace(/^[a-z]=/i, '');
  if (!s) return null;
  const latexFraction = s.match(/^(-?)\\d?frac\{(-?\d+(?:\.\d+)?)\}\{(-?\d+(?:\.\d+)?)\}$/);
  if (latexFraction) {
    const denominator = parseFloat(latexFraction[3]);
    if (!denominator) return null;
    const value = parseFloat(latexFraction[2]) / denominator;
    return latexFraction[1] ? -value : value;
  }
  const fraction = s.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  if (fraction) {
    const denominator = parseFloat(fraction[2]);
    return denominator ? parseFloat(fraction[1]) / denominator : null;
  }
  const percent = s.match(/^(-?\d+(?:\.\d+)?)%$/);
  if (percent) return parseFloat(percent[1]);
  if (/^-?\d*\.?\d+$/.test(s)) return parseFloat(s);
  return null;
};

const nearlyEqual = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

const sameValue = (a, b) => {
  const left = normalizeKey(a);
  const right = normalizeKey(b);
  if (!left || !right) return false;
  if (left === right) return true;
  const leftNumber = parseNumeric(a);
  const rightNumber = parseNumeric(b);
  return leftNumber !== null && rightNumber !== null && nearlyEqual(leftNumber, rightNumber);
};

const normalizeOptions = (options) => {
  if (Array.isArray(options)) {
    return options.map((item, index) => {
      const fallbackLabel = String.fromCharCode(65 + index);
      if (item && typeof item === 'object') {
        return {
          label: toText(item.label ?? item.key ?? item.id ?? fallbackLabel).toUpperCase(),
          text: toText(item.text ?? item.content ?? item.value),
        };
      }
      return { label: fallbackLabel, text: toText(item) };
    });
  }
  if (options && typeof options === 'object') {
    return Object.entries(options).map(([key, value]) => ({
      label: toText(key).toUpperCase(),
      text:
        value && typeof value === 'object'
          ? toText(value.text ?? value.content ?? value.value)
          : toText(value),
    }));
  }
  return [];
};

const findOption = (options, answer) => {
  const key = normalizeKey(answer);
  if (!key) return null;
  return (
    options.find((option) => normalizeKey(option.label) === key) ||
    options.find((option) => normalizeKey(option.text) === key) ||
    null
  );
};

const toMathText = (value, subject = '') => {
  const text = toText(value);
  if (!text || text.includes('$')) return text;
  const fraction = text.match(/^(-?)(\d+)\/(\d+)$/);
  if (fraction) return '$' + fraction[1] + '\\frac{' + fraction[2] + '}{' + fraction[3] + '}$';
  if (/^-?\d*\.?\d+$/.test(text)) return '$' + text + '$';
  if (subject === 'math' && /^[-+*/^=().,\s\w]+$/.test(text) && /[\^=]/.test(text)) {
    return '$' + text + '$';
  }
  return text;
};

const stripMath = (value) =>
  toText(value)
    .replace(/\\d?frac\{([^}]*)\}\{([^}]*)\}/g, '$1/$2')
    .replace(/\\text\{([^}]*)\}/g, '$1')
    .replace(/\^\\circ/g, '°')
    .replace(/\\pi/g, 'π')
    .replace(/\\times/g, '×')
    .replace(/\\([a-zA-Z]+)/g, '$1')
    .replace(/\$/g, '');

const tokenize = (text) => toText(text).toLowerCase().match(/[a-z']{4,}/g) || [];

const overlapRatio = (text, referenceSet) => {
  const tokens = tokenize(text);
  if (tokens.length === 0) return 0;
  const hits = tokens.filter((token) => referenceSet.has(token)).length;
  return hits / tokens.length;
};

const detectSubject = (q, domain) => {
  if (MATH_RE.test(domain)) return 'math';
  if (VERBAL_RE.test(domain)) return 'verbal';
  if (q.isGridIn === true) return 'math';
  const allText = [q.passage, q.prompt, q.question].map(toText).join(' ');
  return /\$|\d\s*[+\-*/=^]\s*\d/.test(allText) ? 'math' : 'verbal';
};

const detectDomainKey = (subject, domain) => {
  const d = domain.toLowerCase();
  if (subject === 'math') {
    if (/advanced/.test(d)) return 'advanced';
    if (/problem|data/.test(d)) return 'psda';
    if (/geometry|trig/.test(d)) return 'geometry';
    if (/algebra/.test(d)) return 'algebra';
    return 'mathGeneral';
  }
  if (/craft/.test(d)) return 'craft';
  if (/information/.test(d)) return 'info';
  if (/convention/.test(d)) return 'conventions';
  if (/expression/.test(d)) return 'expression';
  return 'verbalGeneral';
};

const detectNumericTrap = (userNumber, correctNumber) => {
  if (userNumber === null || correctNumber === null) return null;
  if (nearlyEqual(userNumber, correctNumber)) return null;
  if (correctNumber !== 0 && nearlyEqual(userNumber, -correctNumber)) return 'sign';
  if (correctNumber !== 0 && nearlyEqual(userNumber, correctNumber * 2)) return 'forgotHalf';
  if (correctNumber !== 0 && nearlyEqual(userNumber, correctNumber / 2)) return 'forgotDouble';
  if (correctNumber !== 0 && userNumber !== 0 && nearlyEqual(userNumber, 1 / correctNumber)) {
    return 'reciprocal';
  }
  if (nearlyEqual(Math.abs(userNumber - correctNumber), 1)) return 'offByOne';
  const bothIntegers = Number.isInteger(userNumber) && Number.isInteger(correctNumber);
  if (
    !bothIntegers &&
    Math.abs(userNumber - correctNumber) <= Math.max(0.011, Math.abs(correctNumber) * 0.02)
  ) {
    return 'rounding';
  }
  return null;
};

const toParagraphs = (value) => {
  if (Array.isArray(value)) {
    const list = value.map(toText).filter(Boolean);
    return list.length > 0 ? list : null;
  }
  const text = toText(value);
  return text ? [text] : null;
};

const toSteps = (value) => {
  if (Array.isArray(value)) {
    const list = value.map(toText).filter(Boolean);
    return list.length > 0 ? list.slice(0, 8) : null;
  }
  const text = toText(value);
  if (!text) return null;
  let parts = text.split(/\n+/).map((part) => part.trim()).filter(Boolean);
  if (parts.length === 1) {
    parts = text
      .split(/\.\s+(?=[A-Z$])/)
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => (/[.!?:]$/.test(part) ? part : part + '.'));
  }
  return parts.length > 0 ? parts.slice(0, 8) : null;
};

const buildSteps = ({ subject, domainKey, isGridIn, correctOption, correctRaw }) => {
  const correctText = correctOption ? toMathText(correctOption.text, subject) : '';
  let finalStep;
  if (isGridIn) {
    finalStep = correctRaw
      ? 'Nhập kết quả cuối cùng ' + toMathText(correctRaw, subject) + ' vào ô trả lời.'
      : 'Nhập kết quả cuối cùng vào ô trả lời sau khi đã kiểm tra lại với đề bài.';
  } else if (correctOption) {
    finalStep =
      'Đối chiếu kết quả với các phương án: đáp án đúng là ' +
      correctOption.label +
      (correctText ? ' (' + correctText + ')' : '') +
      '.';
  } else {
    finalStep = 'Đối chiếu kết quả với các phương án và với đáp án chính thức.';
  }
  if (subject === 'math') {
    const modelSteps = {
      algebra:
        'Chuyển đề bài thành phương trình hoặc hệ phương trình, ví dụ $ax + b = c$, rồi cô lập ẩn cần tìm.',
      advanced:
        'Nhận diện dạng hàm (bậc hai, mũ, hữu tỉ) và biến đổi về dạng quen thuộc, ví dụ $y = a(x - h)^2 + k$ hoặc $(x + a)^2 = x^2 + 2ax + a^2$.',
      psda: String.raw`Lập tỉ lệ từ dữ kiện: $\text{phần trăm} = \frac{\text{phần}}{\text{tổng}} \times 100$; xác định đúng nhóm nào là mẫu số.`,
      geometry: String.raw`Vẽ hình, ghi số đo đã cho và chọn công thức phù hợp, ví dụ $A = \pi r^2$, $a^2 + b^2 = c^2$ hoặc $\sin\theta = \frac{\text{đối}}{\text{huyền}}$.`,
      mathGeneral:
        'Chuyển dữ kiện của đề thành phương trình hoặc biểu thức toán học, rồi xác định bước cần làm để tìm đại lượng được hỏi.',
    };
    return [
      'Đọc kỹ câu hỏi và gạch chân đại lượng cần tìm cùng điều kiện đi kèm (ví dụ: giá trị của $2x$, không phải giá trị của $x$).',
      modelSteps[domainKey] || modelSteps.mathGeneral,
      'Tính từng bước, giữ nguyên phân số hoặc căn thức đến bước cuối để tránh sai số do làm tròn.',
      finalStep,
    ];
  }
  const verbalSteps = {
    craft: [
      'Đọc câu chứa chỗ trống hoặc phần được hỏi, tự đoán trước từ hoặc ý cần có trước khi nhìn đáp án.',
      'Tìm manh mối then chốt trong đoạn: từ nối (however, although, because), tính từ mang sắc thái, hoặc ví dụ đi kèm.',
      'Thử từng phương án vào vị trí được hỏi và loại phương án sai sắc thái, sai phạm vi hoặc không có manh mối hỗ trợ.',
      finalStep,
    ],
    info: [
      'Xác định chính xác câu hỏi yêu cầu gì: ý chính, chi tiết, suy luận hay bằng chứng.',
      'Quay lại đoạn văn và định vị câu hoặc cụm từ chứa bằng chứng.',
      'Đối chiếu từng phương án với bằng chứng, loại phương án nói quá, ngoài phạm vi hoặc đảo ngược ý.',
      finalStep,
    ],
    conventions: [
      'Xác định ranh giới mệnh đề: có bao nhiêu mệnh đề độc lập, mệnh đề phụ thuộc và cụm xen giữa.',
      'Xác định quy tắc cần kiểm tra: dấu câu nối mệnh đề, hòa hợp chủ-vị, thì của động từ hoặc đại từ.',
      'Áp dụng quy tắc, ví dụ hai mệnh đề độc lập cần dấu chấm, dấu chấm phẩy hoặc liên từ đi kèm dấu phẩy, không dùng dấu phẩy đơn.',
      finalStep,
    ],
    expression: [
      'Xác định mục tiêu diễn đạt mà đề yêu cầu (nối ý, tóm tắt, nhấn mạnh, so sánh).',
      'Xác định quan hệ logic với câu trước và câu sau: bổ sung, tương phản hay nguyên nhân.',
      'Chọn phương án đáp ứng đúng mục tiêu và chỉ dùng thông tin có trong đề.',
      finalStep,
    ],
    verbalGeneral: [
      'Đọc câu hỏi trước để biết mình cần tìm gì trong đoạn văn.',
      'Định vị bằng chứng cụ thể trong đoạn cho từng phương án.',
      'Loại phương án không có bằng chứng, nói quá hoặc sai phạm vi.',
      finalStep,
    ],
  };
  return verbalSteps[domainKey] || verbalSteps.verbalGeneral;
};

const buildStrategy = ({ subject, domainKey, isGridIn, options, difficulty, negation }) => {
  const base =
    STRATEGIES[domainKey] || STRATEGIES[subject === 'math' ? 'mathGeneral' : 'verbalGeneral'];
  const tips = [...base.tips];
  if (subject === 'math') {
    if (isGridIn) {
      tips.push(GRID_IN_TIP);
    } else if (options.length > 0 && options.every((option) => parseNumeric(option.text) !== null)) {
      tips.push(BACKSOLVE_TIP);
    }
  } else if (negation) {
    tips.unshift(NEGATION_TIP);
  }
  if (difficulty === 'hard') tips.push(HARD_TIP);
  if (difficulty === 'easy') tips.push(EASY_TIP);
  return { headline: base.headline, tips };
};

const buildAnalysis = (q) => {
  const options = normalizeOptions(q.options);
  const isGridIn = q.isGridIn === true || options.length === 0;
  const domain = toText(q.domain);
  const difficulty = toText(q.difficulty).toLowerCase();
  const subject = detectSubject(q, domain);
  const domainKey = detectDomainKey(subject, domain);
  const userRaw = toText(q.userAnswer);
  const correctRaw = toText(q.correctAnswer);
  const userOption = isGridIn ? null : findOption(options, userRaw);
  const correctOption = isGridIn ? null : findOption(options, correctRaw);
  const userValueText = userOption ? userOption.text : userRaw;
  const correctValueText = correctOption ? correctOption.text : correctRaw;
  const questionText = toText(q.question);
  const negation = subject === 'verbal' && NEGATION_RE.test(questionText);
  let status = 'wrong';
  if (!userRaw) {
    status = 'skipped';
  } else if (userOption && correctOption) {
    status = userOption.label === correctOption.label ? 'correct' : 'wrong';
  } else if (correctRaw && sameValue(userRaw, correctRaw)) {
    status = 'correct';
  }
  let trapKey = domainKey;
  if (status === 'skipped') {
    trapKey = 'skipped';
  } else if (status === 'wrong') {
    if (subject === 'math') {
      const numericKey = detectNumericTrap(parseNumeric(userValueText), parseNumeric(correctValueText));
      if (numericKey) trapKey = numericKey;
    } else if (negation) {
      trapKey = 'negation';
    } else if (userOption && domainKey !== 'conventions') {
      const stemSet = new Set(
        tokenize([q.passage, q.prompt].map(toText).join(' ')),
      );
      const userRatio = overlapRatio(userOption.text, stemSet);
      const correctRatio = correctOption ? overlapRatio(correctOption.text, stemSet) : 0;
      if (EXTREME_RE.test(userOption.text)) {
        trapKey = 'extreme';
      } else if (
        stemSet.size > 0 &&
        tokenize(userOption.text).length >= 3 &&
        userRatio >= 0.6 &&
        userRatio - correctRatio >= 0.2
      ) {
        trapKey = 'echo';
      }
    }
  }
  const trap = TRAPS[trapKey] || TRAPS[domainKey] || TRAPS.mathGeneral;
  const domainTrap = TRAPS[domainKey] || trap;
  let trapTag = trap.tag;
  let trapParagraphs = [...trap.body];
  let takeaway = trap.takeaway;
  if (status === 'wrong') {
    if (DIFFICULTY_NOTES[difficulty]) trapParagraphs.push(DIFFICULTY_NOTES[difficulty]);
  } else if (status === 'correct') {
    const formatDiffers = normalizeKey(userRaw) !== normalizeKey(correctRaw);
    trapTag = 'Bạn đã tránh được bẫy';
    trapParagraphs = [
      'Đáp án bạn chọn trùng với đáp án chính thức' +
        (formatDiffers
          ? ' (giá trị bằng nhau dù cách viết khác nhau; Digital SAT chấp nhận cả phân số và số thập phân tương đương)'
          : '') +
        '. Dù vậy, hãy nhớ bẫy thường gặp ở dạng bài này để không mắc lần sau:',
      domainTrap.common || domainTrap.body[0],
    ];
    takeaway = domainTrap.takeaway;
  }
  const override = q.aiAnalysis && typeof q.aiAnalysis === 'object' ? q.aiAnalysis : {};
  const customSteps =
    toSteps(override.steps) ||
    toSteps(q.solutionSteps) ||
    toSteps(q.explanation) ||
    toSteps(q.rationale);
  const strategy = buildStrategy({ subject, domainKey, isGridIn, options, difficulty, negation });
  const overrideStrategy = toParagraphs(override.strategy);
  return {
    status,
    trapTag: toText(override.trapTag) || trapTag,
    trapParagraphs: toParagraphs(override.trap) || trapParagraphs,
    strategy: overrideStrategy
      ? { headline: toText(override.strategyHeadline) || strategy.headline, tips: overrideStrategy }
      : strategy,
    steps:
      customSteps ||
      buildSteps({ subject, domainKey, isGridIn, correctOption, correctRaw }),
    takeaway: toText(override.takeaway) || takeaway,
    user: {
      label: userOption ? userOption.label : '',
      content: toMathText(userValueText, subject),
    },
    correct: {
      label: correctOption ? correctOption.label : '',
      content: toMathText(correctValueText, subject),
    },
  };
};

const copyToClipboard = async (text) => {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (error) {
    // Fallback
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const succeeded = document.execCommand('copy');
    document.body.removeChild(textarea);
    return succeeded;
  } catch (error) {
    return false;
  }
};

/* -------------------------------------------------------------------------- */
/* Component con                                                              */
/* -------------------------------------------------------------------------- */
const SECTION_TONES = {
  rose: 'bg-rose-50 text-rose-600 ring-rose-100',
  amber: 'bg-amber-50 text-amber-600 ring-amber-100',
  indigo: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
  emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
};

const SectionCard = ({ icon: Icon, tone, title, subtitle, className = '', children }) => (
  <section
    className={`rounded-3xl border border-slate-200/70 p-5 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)] sm:p-6 ${
      className || 'bg-white'
    }`}
  >
    <div className="mb-4 flex items-center gap-3">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1 ${SECTION_TONES[tone]}`}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h3 className="text-base font-semibold leading-tight text-slate-900">{title}</h3>
        <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
    {children}
  </section>
);

const ANSWER_TONES = {
  rose: 'bg-rose-50/80 ring-rose-200/70 text-rose-700',
  emerald: 'bg-emerald-50/80 ring-emerald-200/70 text-emerald-700',
  slate: 'bg-white ring-slate-200 text-slate-600',
};

const AnswerBox = ({ tone, title, label, content, className = '' }) => (
  <div className={`rounded-2xl p-3.5 ring-1 ${ANSWER_TONES[tone]} ${className}`}>
    <p className="mb-1.5 text-xs font-medium">{title}</p>
    <div className="flex items-start gap-2.5 text-sm text-slate-900">
      {label ? (
        <span className="flex h-6 min-w-[1.5rem] shrink-0 items-center justify-center rounded-lg bg-white px-1.5 text-xs font-bold text-slate-800 shadow-sm ring-1 ring-slate-200">
          {label}
        </span>
      ) : null}
      <div className="min-w-0 break-words">
        {content ? <MathRenderer text={content} /> : <span className="text-slate-400">Không có dữ liệu</span>}
      </div>
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/* Component chính                                                            */
/* -------------------------------------------------------------------------- */
const AiTutorModal = ({ isOpen = false, onClose, question }) => {
  const [phase, setPhase] = useState('analyzing');
  const [messageIndex, setMessageIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const dialogRef = useRef(null);

  const safeQuestion = useMemo(
    () => (question && typeof question === 'object' ? question : {}),
    [question],
  );

  const questionKey = useMemo(
    () =>
      [
        safeQuestion.id,
        safeQuestion.question,
        safeQuestion.userAnswer,
        safeQuestion.correctAnswer,
      ]
        .map(toText)
        .join('|'),
    [safeQuestion],
  );

  const analysis = useMemo(() => buildAnalysis(safeQuestion), [safeQuestion]);

  const handleClose = useCallback(() => {
    if (typeof onClose === 'function') onClose();
  }, [onClose]);

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      setCopied(false);
    }, TOAST_DURATION_MS);
  }, []);

  useEffect(() => () => clearTimeout(toastTimerRef.current), []);

  useEffect(() => {
    if (!isOpen) return undefined;
    setPhase('analyzing');
    setMessageIndex(0);
    setExpanded(false);
    setCopied(false);
    setToast(null);
    const stepMs = Math.floor(ANALYZING_DURATION_MS / ANALYZING_MESSAGES.length);
    const messageTimer = setInterval(() => {
      setMessageIndex((previous) => Math.min(previous + 1, ANALYZING_MESSAGES.length - 1));
    }, stepMs);
    const doneTimer = setTimeout(() => setPhase('ready'), ANALYZING_DURATION_MS);
    return () => {
      clearInterval(messageTimer);
      clearTimeout(doneTimer);
    };
  }, [isOpen, questionKey]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (dialogRef.current) dialogRef.current.focus();
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, handleClose]);

  const handleCopy = useCallback(async () => {
    const lessonText = 'Bài học rút ra: ' + stripMath(analysis.takeaway);
    const succeeded = await copyToClipboard(lessonText);
    if (succeeded) {
      setCopied(true);
      showToast('success', 'Đã sao chép bài học vào clipboard');
    } else {
      setCopied(false);
      showToast('error', 'Không thể sao chép, hãy thử lại');
    }
  }, [analysis.takeaway, showToast]);

  if (!isOpen) return null;

  const stemTexts = [toText(safeQuestion.passage), toText(safeQuestion.prompt)].filter(
    (text, index, list) => text && list.indexOf(text) === index,
  );
  const questionText = toText(safeQuestion.question);
  const stemLength = stemTexts.join(' ').length;
  const needsCollapse = stemLength > COLLAPSE_THRESHOLD;
  const domainLabel = toText(safeQuestion.domain);
  const difficultyKey = toText(safeQuestion.difficulty).toLowerCase();
  const difficultyMeta = DIFFICULTY_META[difficultyKey];
  const isCorrect = analysis.status === 'correct';
  const isSkipped = analysis.status === 'skipped';
  const TrapIcon = isCorrect ? Check : AlertTriangle;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 select-none font-sans">
      <style>{`
        @keyframes aitutor-scan { 0% { transform: translateY(-120%); } 100% { transform: translateY(320%); } }
        @keyframes aitutor-reveal { 0% { opacity: 0; transform: translateY(8px); } 100% { opacity: 1; transform: translateY(0); } }
        .aitutor-scan { animation: aitutor-scan 0.8s ease-in-out infinite; }
        .aitutor-reveal { animation: aitutor-reveal 0.35s ease-out both; }
        @media (prefers-reduced-motion: reduce) { .aitutor-scan, .aitutor-reveal { animation: none; } }
      `}</style>
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-tutor-modal-title"
        tabIndex={-1}
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_-20px_rgba(15,23,42,0.35)] ring-1 ring-slate-900/5 outline-none"
      >
        {/* Header */}
        <header className="flex items-start gap-4 border-b border-slate-100 bg-white/90 px-5 py-4 backdrop-blur sm:px-6">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/30">
            <Bot className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              SAT AI Co-Pilot
            </span>
            <h2 id="ai-tutor-modal-title" className="mt-1.5 text-lg font-semibold leading-snug text-slate-900">
              Phân tích bẫy đề thi và tư duy giải nhanh
            </h2>
            {(domainLabel || difficultyMeta) && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {domainLabel ? (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {domainLabel}
                  </span>
                ) : null}
                {difficultyMeta ? (
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${difficultyMeta.className}`}
                  >
                    {difficultyMeta.label}
                  </span>
                ) : null}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Đóng"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        {/* Nội dung */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          {phase === 'analyzing' ? (
            <div
              className="flex flex-col items-center px-4 py-10 text-center"
              role="status"
              aria-live="polite"
            >
              <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30">
                <Bot className="h-9 w-9" aria-hidden="true" />
                <span className="absolute inset-0 rounded-3xl ring-4 ring-indigo-400/30 animate-ping motion-reduce:animate-none" />
              </div>
              <p className="text-base font-semibold text-slate-900">{ANALYZING_MESSAGES[messageIndex]}</p>
              <div className="mt-3 flex items-center gap-1.5" aria-hidden="true">
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce motion-reduce:animate-none"
                    style={{ animationDelay: `${dot * 120}ms` }}
                  />
                ))}
              </div>
              <div className="relative mt-8 w-full max-w-md overflow-hidden rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="space-y-2.5">
                  <div className="h-2.5 w-full rounded bg-slate-200 animate-pulse motion-reduce:animate-none" />
                  <div className="h-2.5 w-11/12 rounded bg-slate-200 animate-pulse motion-reduce:animate-none" />
                  <div className="h-2.5 w-4/5 rounded bg-slate-200 animate-pulse motion-reduce:animate-none" />
                  <div className="h-2.5 w-2/3 rounded bg-slate-200 animate-pulse motion-reduce:animate-none" />
                </div>
                <span className="aitutor-scan pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-transparent via-indigo-300/30 to-transparent" />
              </div>
            </div>
          ) : (
            <div className="aitutor-reveal space-y-4">
              {/* Tóm tắt câu hỏi */}
              <div className="rounded-3xl bg-slate-50/80 p-4 ring-1 ring-slate-200/70 sm:p-5">
                {stemTexts.length > 0 && (
                  <div className="relative">
                    <div
                      className={`space-y-2 break-words text-sm leading-relaxed text-slate-700 font-serif select-text ${
                        expanded || !needsCollapse ? '' : 'max-h-24 overflow-hidden'
                      }`}
                    >
                      {stemTexts.map((text, idx) => (
                        <div key={idx}>
                          <MathRenderer text={text} />
                        </div>
                      ))}
                    </div>
                    {needsCollapse && !expanded ? (
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-50 to-transparent" />
                    ) : null}
                  </div>
                )}
                {needsCollapse ? (
                  <button
                    type="button"
                    onClick={() => setExpanded((previous) => !previous)}
                    className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                  >
                    {expanded ? 'Thu gọn đề bài' : 'Xem đầy đủ đề bài'}
                  </button>
                ) : null}
                {questionText ? (
                  <div className="mt-3 break-words text-sm font-medium leading-relaxed text-slate-900">
                    <MathRenderer text={questionText} />
                  </div>
                ) : null}
                {stemTexts.length === 0 && !questionText ? (
                  <p className="text-sm text-slate-500">Câu hỏi này chưa có nội dung đề bài để hiển thị.</p>
                ) : null}
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {isCorrect ? (
                    <AnswerBox
                      tone="emerald"
                      title="Bạn đã chọn đúng"
                      label={analysis.correct.label}
                      content={analysis.correct.content}
                      className="sm:col-span-2"
                    />
                  ) : (
                    <>
                      <AnswerBox
                        tone={isSkipped ? 'slate' : 'rose'}
                        title={isSkipped ? 'Bạn chưa chọn đáp án' : 'Bạn đã chọn'}
                        label={analysis.user.label}
                        content={isSkipped ? '' : analysis.user.content}
                      />
                      <AnswerBox
                        tone="emerald"
                        title="Đáp án đúng"
                        label={analysis.correct.label}
                        content={analysis.correct.content}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* 1. Giải mã bẫy tâm lý */}
              <SectionCard
                icon={TrapIcon}
                tone={isCorrect ? 'emerald' : 'rose'}
                title="Giải mã bẫy tâm lý"
                subtitle="Why you picked it: the distractor trap"
              >
                <span
                  className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                    isCorrect
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                      : 'bg-rose-50 text-rose-700 ring-rose-200'
                  }`}
                >
                  {analysis.trapTag}
                </span>
                <div className="space-y-2.5 text-sm leading-relaxed text-slate-700">
                  {analysis.trapParagraphs.map((paragraph, index) => (
                    <div key={index} className="break-words">
                      <MathRenderer text={paragraph} />
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* 2. Chiến thuật tư duy 30 giây */}
              <SectionCard
                icon={Zap}
                tone="amber"
                title="Chiến thuật tư duy 30 giây"
                subtitle="30-second strategy"
              >
                <p className="mb-3 text-sm font-semibold text-slate-900">{analysis.strategy.headline}</p>
                <ul className="space-y-2.5">
                  {analysis.strategy.tips.map((tip, index) => (
                    <li key={index} className="flex gap-3">
                      <span
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400"
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1 break-words text-sm leading-relaxed text-slate-700">
                        <MathRenderer text={tip} />
                      </div>
                    </li>
                  ))}
                </ul>
              </SectionCard>

              {/* 3. Quy trình giải chuẩn College Board */}
              <SectionCard
                icon={ListOrdered}
                tone="indigo"
                title="Quy trình giải chuẩn College Board"
                subtitle="Step-by-step breakdown"
              >
                <ol className="space-y-3">
                  {analysis.steps.map((step, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1 break-words text-sm leading-relaxed text-slate-700">
                        <MathRenderer text={step} />
                      </div>
                    </li>
                  ))}
                </ol>
              </SectionCard>

              {/* 4. Bài học rút ra */}
              <SectionCard
                icon={CheckCircle2}
                tone="emerald"
                title="Bài học rút ra"
                subtitle="Key takeaway"
                className="bg-gradient-to-br from-emerald-50/80 to-white"
              >
                <div className="break-words text-base font-semibold leading-relaxed text-slate-900">
                  <MathRenderer text={analysis.takeaway} />
                </div>
              </SectionCard>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex flex-col gap-3 border-t border-slate-100 bg-white/90 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-slate-500">Bản phân tích được tổng hợp tự động từ AI Tutor Co-Pilot.</p>
          <div className="flex items-center gap-2 sm:shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 cursor-pointer sm:flex-none"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={phase !== 'ready'}
              className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white shadow-md transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none ${
                copied
                  ? 'bg-emerald-600 shadow-emerald-600/30'
                  : 'bg-indigo-600 shadow-indigo-600/30 hover:bg-indigo-700'
              }`}
            >
              {copied ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
              {copied ? 'Đã sao chép' : 'Sao chép bài học'}
            </button>
          </div>
        </footer>

        {toast ? (
          <div
            role="status"
            aria-live="polite"
            className={`pointer-events-none absolute bottom-24 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium text-white shadow-lg ${
              toast.type === 'success' ? 'bg-slate-900' : 'bg-rose-600'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            )}
            {toast.message}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AiTutorModal;