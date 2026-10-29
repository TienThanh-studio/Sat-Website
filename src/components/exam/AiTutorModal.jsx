// src/components/exam/AiTutorModal.jsx
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
  BookOpen,
  XCircle,
} from 'lucide-react';
import MathRenderer from '../common/MathRenderer';

/* -------------------------------------------------------------------------- */
/* Hằng số                                                                    */
/* -------------------------------------------------------------------------- */
const ANALYZING_DURATION_MS = 650;
const TOAST_DURATION_MS = 2200;
const COLLAPSE_THRESHOLD = 240;
const ANALYZING_MESSAGES = [
  'Đang quét đề bài & giải nghĩa 4 phương án A, B, C, D…',
  'Nhận diện dạng bài, dấu hiệu ngữ cảnh và bẫy…',
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
/* Từ điển Giải nghĩa Nhanh các Phương án A, B, C, D (Chuẩn Digital SAT)      */
/* -------------------------------------------------------------------------- */
const SAT_OPTION_LEXICON = {
  abate: { pos: 'v.', vi: 'dịu bớt, suy giảm cường độ (bão, cơn sốt)', en: 'to become weaker or less intense; lessen', syn: ['subside', 'diminish', 'weaken'] },
  abiding: { pos: 'adj.', vi: 'bền bỉ, lâu dài, vĩnh cửu', en: 'lasting a long time; enduring', syn: ['enduring', 'lasting', 'permanent'] },
  abstain: { pos: 'v.', vi: 'kiêng, chủ động tránh làm gì (abstain from)', en: 'to deliberately avoid or hold back from', syn: ['refrain from', 'forgo'] },
  abundant: { pos: 'adj.', vi: 'dồi dào, phong phú, rất nhiều', en: 'existing in large quantities; plentiful', syn: ['plentiful', 'copious', 'ample'] },
  accentuate: { pos: 'v.', vi: 'nhấn mạnh, làm nổi bật lên', en: 'to make more noticeable or prominent', syn: ['emphasize', 'highlight', 'underscore'] },
  acclaim: { pos: 'n./v.', vi: 'sự tán dương, lời ca ngợi nhiệt liệt từ giới phê bình', en: 'enthusiastic and public praise', syn: ['praise', 'commendation', 'applause'] },
  accommodate: { pos: 'v.', vi: 'đáp ứng, dành chỗ cho khả năng phát triển', en: 'to allow for or make room for something', syn: ['allow for', 'provide for'] },
  accumulate: { pos: 'v.', vi: 'tích tụ, bồi đắp dần theo thời gian', en: 'to gather or build up over time', syn: ['amass', 'collect', 'build up'] },
  accurate: { pos: 'adj.', vi: 'chính xác, chuẩn xác', en: 'correct in all details; exact', syn: ['precise', 'exact'] },
  adept: { pos: 'adj.', vi: 'thành thạo, điêu luyện, tinh thông (adept at)', en: 'very skilled or proficient at something', syn: ['skilled at', 'proficient in', 'expert at'] },
  adequate: { pos: 'adj.', vi: 'đầy đủ, thỏa đáng (đủ lớn để đáng tin cậy)', en: 'satisfactory or acceptable in quality or quantity', syn: ['sufficient', 'enough'] },
  adhere: { pos: 'v.', vi: 'tuân thủ chặt chẽ, gắn bó với (adhere to)', en: 'to stick closely to a practice, rule, or belief', syn: ['follow', 'abide by'] },
  admonition: { pos: 'n.', vi: 'lời cảnh báo, lời khuyên răn thận trọng', en: 'a firm warning or piece of cautionary advice', syn: ['warning', 'caution'] },
  affinity: { pos: 'n.', vi: 'sự yêu thích tự nhiên, niềm đam mê gắn bó', en: 'a natural liking for or attraction to something', syn: ['fondness', 'liking'] },
  alleviate: { pos: 'v.', vi: 'làm giảm nhẹ, làm dịu bớt (vấn đề/nỗi đau)', en: 'to make suffering or a problem less severe', syn: ['mitigate', 'ameliorate', 'relieve'] },
  amalgamated: { pos: 'v./adj.', vi: 'hợp nhất, pha trộn thành một khối', en: 'combined or united to form one structure', syn: ['merged', 'fused'] },
  amass: { pos: 'v.', vi: 'tập hợp lại với số lượng lớn tại một khu vực (amass in)', en: 'to gather together in large numbers in one place', syn: ['cluster', 'congregate', 'gather'] },
  ambiguous: { pos: 'adj.', vi: 'mơ hồ, đa nghĩa, không rõ ràng', en: 'open to more than one interpretation; unclear', syn: ['unclear', 'equivocal', 'vague'] },
  ambivalence: { pos: 'n.', vi: 'sự mâu thuẫn cảm xúc (vừa thích vừa e ngại)', en: 'the state of having mixed or contradictory feelings', syn: ['uncertainty', 'conflict'] },
  ambivalent: { pos: 'adj.', vi: 'có cảm xúc lẫn lộn, mâu thuẫn hai chiều', en: 'having mixed or contradictory feelings about something', syn: ['conflicted', 'torn'] },
  ameliorate: { pos: 'v.', vi: 'cải thiện, khắc phục, làm dịu bớt tình trạng xấu', en: 'to make a bad situation or shortcoming better or less severe', syn: ['mitigate', 'alleviate', 'improve'] },
  amenable: { pos: 'adj.', vi: 'có thể tiếp nhận/xử lý hiệu quả bằng phương pháp nào đó', en: 'responsive to or capable of being treated by a process', syn: ['responsive', 'susceptible'] },
  amorphous: { pos: 'adj.', vi: 'vô định hình, không có cấu trúc hay ranh giới cố định', en: 'without a clearly defined shape, form, or boundary', syn: ['formless', 'unstructured'] },
  amplify: { pos: 'v.', vi: 'khuếch đại, làm tăng thêm mức độ', en: 'to increase the strength or amount of', syn: ['intensify', 'magnify'] },
  analogical: { pos: 'adj.', vi: 'dựa trên phép loại suy/so sánh tương đồng', en: 'based on analogy or comparison', syn: ['comparative', 'parallel'] },
  analogous: { pos: 'adj.', vi: 'tương đồng ở một số khía cạnh, có thể so sánh được', en: 'similar in some important way, allowing a comparison', syn: ['comparable', 'similar', 'akin'] },
  anecdotal: { pos: 'adj.', vi: 'dựa trên giai thoại/trải nghiệm cá nhân (chưa kiểm chứng khoa học)', en: 'based on personal stories rather than systematic evidence', syn: ['unscientific', 'unverified'] },
  annotate: { pos: 'v.', vi: 'chú giải, viết ghi chú giải thích vào văn bản', en: 'to add explanatory notes to a text', syn: ['comment on', 'gloss'] },
  anomalous: { pos: 'adj.', vi: 'bất thường, dị biệt, lệch khỏi quy luật chung', en: 'deviating from what is standard, normal, or expected', syn: ['atypical', 'irregular', 'aberrant'] },
  anticipating: { pos: 'v.', vi: 'háo hức mong đợi, ngóng trông (looking forward to)', en: 'looking forward to or expecting eagerly', syn: ['looking forward to', 'expecting'] },
  apathy: { pos: 'n.', vi: 'sự thờ ơ, lãnh đạm, thiếu quan tâm', en: 'lack of interest, enthusiasm, or concern', syn: ['indifference', 'unconcern'] },
  appeased: { pos: 'v.', vi: 'xoa dịu, làm nguôi giận bằng cách nhượng bộ', en: 'pacified or placated by acceding to demands', syn: ['placated', 'pacified'] },
  applicable: { pos: 'adj.', vi: 'có thể áp dụng được, phù hợp với (applicable to)', en: 'relevant or appropriate to a case', syn: ['relevant', 'appropriate'] },
  applaud: { pos: 'v.', vi: 'tán dương, ca ngợi mạnh mẽ', en: 'to express strong approval of; praise', syn: ['praise', 'commend', 'laud'] },
  appraising: { pos: 'v.', vi: 'thẩm định, đánh giá giá trị hoặc chất lượng', en: 'assessing the value or quality of', syn: ['evaluating', 'assessing'] },
  apprised: { pos: 'adj.', vi: 'được thông báo, nắm rõ thông tin (apprised of)', en: 'informed or told about something', syn: ['informed', 'notified'] },
  arbitrary: { pos: 'adj.', vi: 'tùy tiện, cảm tính, không dựa trên lý lẽ', en: 'based on random choice or personal whim rather than reason', syn: ['random', 'capricious'] },
  arcane: { pos: 'adj.', vi: 'bí truyền, khó hiểu, chỉ ít người biết', en: 'understood by few; mysterious or secret', syn: ['esoteric', 'obscure'] },
  arduous: { pos: 'adj.', vi: 'gian khổ, nhọc nhằn, đòi hỏi nhiều công sức bền bỉ', en: 'involving or requiring strenuous effort; difficult and tiring', syn: ['laborious', 'grueling', 'taxing'] },
  assert: { pos: 'v.', vi: 'khẳng định, tuyên bố dứt khoát (quyền lực/quan điểm)', en: 'to state a fact or belief confidently and forcefully', syn: ['declare', 'uphold', 'maintain'] },
  assuage: { pos: 'v.', vi: 'xoa dịu, làm vơi đi (nỗi lo âu, sự băn khoăn)', en: 'to make an unpleasant feeling or worry less intense', syn: ['relieve', 'ease', 'alleviate'] },
  attest: { pos: 'v.', vi: 'chứng thực, là bằng chứng rõ ràng cho (attest to)', en: 'to serve as clear evidence of', syn: ['confirm', 'demonstrate'] },
  attribute: { pos: 'v.', vi: 'quy cho nguyên nhân là do (attribute to)', en: 'to regard something as being caused by a factor', syn: ['ascribe to', 'credit to'] },
  augment: { pos: 'v.', vi: 'làm tăng thêm, mở rộng quy mô/số lượng', en: 'to make something greater by adding to it', syn: ['increase', 'supplement', 'boost'] },
  belie: { pos: 'v.', vi: 'che giấu sự thật, tạo ấn tượng sai lệch về, mâu thuẫn với', en: 'to give a false or misleading impression of; contradict', syn: ['misrepresent', 'disguise', 'contradict'] },
  bestowed: { pos: 'v.', vi: 'ban tặng, trao tặng vinh dự (bestowed on)', en: 'conferred or presented as an honor or gift', syn: ['conferred', 'granted'] },
  breadth: { pos: 'n.', vi: 'bề rộng, sự đa dạng và quy mô bao quát (breadth of)', en: 'wide range, scope, or extent', syn: ['scope', 'range', 'diversity'] },
  breathes: { pos: 'v.', vi: 'truyền vào, thổi hồn/lòng dũng cảm vào (imparts)', en: 'imparts; instills or conveys a quality to others', syn: ['imparts', 'instills', 'infuses'] },
  buttress: { pos: 'v.', vi: 'củng cố, nâng đỡ, làm chỗ dựa vững chắc cho', en: 'to increase the strength of; reinforce or bolster', syn: ['reinforce', 'strengthen', 'bolster'] },
  capitalizing: { pos: 'v.', vi: 'tận dụng cơ hội để hưởng lợi (capitalizing on)', en: 'taking the chance to gain advantage from', syn: ['exploiting', 'leveraging'] },
  catalyst: { pos: 'n.', vi: 'chất xúc tác, tác nhân thúc đẩy sự thay đổi', en: 'something that causes or speeds up an important change', syn: ['stimulus', 'impetus', 'spur'] },
  circumvent: { pos: 'v.', vi: 'lách qua, né tránh, tìm đường đi vòng qua rào cản', en: 'to find a way around an obstacle', syn: ['bypass', 'evade', 'sidestep'] },
  clandestine: { pos: 'adj.', vi: 'bí mật, lén lút, giấu kín', en: 'kept secret or done secretively', syn: ['covert', 'secret'] },
  coalesce: { pos: 'v.', vi: 'kết tụ lại, hợp nhất thành một khối thống nhất', en: 'to come together to form one mass or whole', syn: ['merge', 'unite', 'fuse'] },
  cohesion: { pos: 'n.', vi: 'sự gắn kết chặt chẽ thành một thể thống nhất', en: 'the action or fact of forming a united whole', syn: ['unity', 'solidarity'] },
  collaboration: { pos: 'n.', vi: 'sự hợp tác, sự cộng tác nghiên cứu giữa các bên', en: 'the act of working together with others', syn: ['cooperation', 'partnership'] },
  commend: { pos: 'v.', vi: 'tuyên dương, khen ngợi chính thức', en: 'to praise formally or publicly', syn: ['praise', 'applaud', 'laud'] },
  commended: { pos: 'v.', vi: 'đã tuyên dương, ca ngợi nồng nhiệt', en: 'praised formally or publicly', syn: ['praised', 'applauded', 'lauded'] },
  complementary: { pos: 'adj.', vi: 'bổ trợ lẫn nhau, bù đắp những gì bên kia thiếu', en: 'combining so that each supplies what the other lacks', syn: ['mutually supportive'] },
  compound: { pos: 'v.', vi: 'làm trầm trọng thêm (một vấn đề khó khăn)', en: 'to make something bad worse; intensify negative aspects', syn: ['exacerbate', 'aggravate', 'worsen'] },
  comprehensive: { pos: 'adj.', vi: 'toàn diện, bao quát đầy đủ mọi mặt', en: 'complete; including all or nearly all elements', syn: ['thorough', 'exhaustive'] },
  compulsory: { pos: 'adj.', vi: 'bắt buộc theo quy định/luật lệ', en: 'required by law or a rule; obligatory', syn: ['mandatory', 'obligatory'] },
  conceivable: { pos: 'adj.', vi: 'có thể hình dung được, có thể xảy ra được', en: 'capable of being imagined or grasped mentally; possible', syn: ['imaginable', 'possible'] },
  concentrate: { pos: 'v.', vi: 'tập trung, tụ họp đông lại tại một vùng/khu vực', en: 'to gather or cluster together in a specific region', syn: ['cluster', 'amass', 'congregate'] },
  concur: { pos: 'v.', vi: 'đồng tình, nhất trí (concur with)', en: 'to be of the same opinion; agree', syn: ['agree', 'accord'] },
  confounded: { pos: 'v.', vi: 'làm bối rối, làm đau đầu không giải được suốt nhiều năm', en: 'caused surprise or confusion in; baffled completely', syn: ['baffled', 'perplexed', 'eluded'] },
  conflate: { pos: 'v.', vi: 'đánh đồng, gộp nhầm hai khái niệm khác nhau làm một', en: 'to wrongly treat two distinct things as one and the same', syn: ['confuse', 'mix up'] },
  conjectures: { pos: 'n.', vi: 'những lời phỏng đoán, suy đoán khi thiếu dữ liệu thực tế', en: 'opinions or conclusions formed on incomplete information', syn: ['guesses', 'speculations', 'surmises'] },
  consequences: { pos: 'n.', vi: 'những hệ quả, tác động kéo theo đối với (consequences for)', en: 'results or effects of an action or condition', syn: ['effects', 'ramifications', 'outcomes'] },
  considerable: { pos: 'adj.', vi: 'đáng kể, khá lớn (về chiều cao, tầm vóc, số lượng)', en: 'notably large in size, amount, or extent', syn: ['substantial', 'significant', 'sizable'] },
  conspicuous: { pos: 'adj.', vi: 'nổi bật đập vào mắt, dễ nhận thấy', en: 'standing out so as to be clearly visible', syn: ['noticeable', 'prominent'] },
  constrain: { pos: 'v.', vi: 'kiềm chế, giới hạn, bó buộc', en: 'to severely restrict the scope or activity of', syn: ['restrict', 'limit', 'curb'] },
  contemplated: { pos: 'v.', vi: 'suy ngẫm, trầm ngâm dự tính', en: 'thought deeply and at length about', syn: ['pondered', 'considered'] },
  contentious: { pos: 'adj.', vi: 'gây nhiều tranh cãi, bất đồng gay gắt', en: 'causing or likely to cause an argument; controversial', syn: ['controversial', 'disputed'] },
  contingent: { pos: 'adj.', vi: 'phụ thuộc vào điều kiện (contingent on)', en: 'depending on something else; determined by it', syn: ['dependent on', 'conditional on'] },
  continuity: { pos: 'n.', vi: 'tính liên tục, sự kế thừa xuyên suốt không đứt đoạn', en: 'the unbroken and consistent existence of something over time', syn: ['consistency', 'persistence'] },
  contributions: { pos: 'n.', vi: 'những đóng góp, tư liệu đóng góp quý giá', en: 'things given or supplied to help a shared effort', syn: ['donations', 'additions', 'inputs'] },
  conventional: { pos: 'adj.', vi: 'thông thường, phổ biến theo chuẩn mực chung', en: 'based on what is generally done or believed; standard', syn: ['standard', 'customary', 'traditional'] },
  convened: { pos: 'v.', vi: 'triệu tập, nhóm họp chính thức', en: 'came together for a meeting or formal discussion', syn: ['assembled', 'gathered', 'met'] },
  converge: { pos: 'v.', vi: 'hội tụ lại cùng một điểm', en: 'to come together from different directions', syn: ['meet', 'intersect'] },
  copious: { pos: 'adj.', vi: 'dồi dào, phong phú, số lượng lớn', en: 'existing in large amounts; plentiful', syn: ['abundant', 'plentiful'] },
  corroborate: { pos: 'v.', vi: 'củng cố, xác nhận một giả thuyết bằng bằng chứng thực nghiệm', en: 'to confirm or support with additional evidence', syn: ['confirm', 'verify', 'substantiate'] },
  corroborated: { pos: 'v.', vi: 'đã củng cố, xác nhận bằng bằng chứng', en: 'confirmed or supported with additional evidence', syn: ['confirmed', 'verified', 'substantiated'] },
  counteract: { pos: 'v.', vi: 'chống lại, làm trung hòa tác động', en: 'to act against something to reduce its force', syn: ['neutralize', 'offset'] },
  counterbalance: { pos: 'v.', vi: 'đối trọng lại, cân bằng lại', en: 'to neutralize or weigh the effect of', syn: ['offset', 'compensate for'] },
  counterfactual: { pos: 'adj.', vi: 'phản thực tế (giả định điều sẽ xảy ra nếu quá khứ khác đi)', en: 'imagining what would have happened if events had gone differently', syn: ['hypothetical', 'contrary-to-fact'] },
  critical: { pos: 'adj.', vi: 'cực kỳ quan trọng, thiết yếu sống còn', en: 'extremely important; essential', syn: ['crucial', 'vital', 'essential'] },
  curtail: { pos: 'v.', vi: 'cắt giảm, thu hẹp bớt', en: 'to reduce in extent or quantity; restrict', syn: ['reduce', 'cut back'] },
  customary: { pos: 'adj.', vi: 'theo phong tục, thông lệ quen thuộc', en: 'according to usual practices or customs', syn: ['usual', 'traditional'] },
  dearth: { pos: 'n.', vi: 'sự khan hiếm, sự thiếu hụt trầm trọng (a dearth of)', en: 'a scarcity or lack of something', syn: ['scarcity', 'paucity', 'shortage'] },
  decoupled: { pos: 'adj.', vi: 'tách rời, không liên hệ với (decoupled from)', en: 'separated or dissociated from something', syn: ['separated', 'disconnected'] },
  defunct: { pos: 'adj.', vi: 'đã ngừng hoạt động, bị khai tử (phần mềm/công ty cũ)', en: 'no longer existing or functioning', syn: ['discontinued', 'obsolete', 'extinct'] },
  defy: { pos: 'v.', vi: 'thách thức mọi nỗ lực giải thích; cưỡng lại', en: 'to resist or withstand attempts to explain or solve', syn: ['resist', 'elude', 'withstand'] },
  delicate: { pos: 'adj.', vi: 'mỏng manh, dễ vỡ, tinh tế', en: 'easily broken or damaged; fragile', syn: ['fragile', 'dainty', 'frail'] },
  demarcated: { pos: 'v.', vi: 'phân định ranh giới, tách biệt rõ khỏi (demarcated from)', en: 'set the boundaries of; separated clearly from', syn: ['distinguished from', 'separated from'] },
  denigrate: { pos: 'v.', vi: 'bôi nhọ, chê bai làm giảm giá trị', en: 'to criticize unfairly; disparage', syn: ['belittle', 'disparage'] },
  denounce: { pos: 'v.', vi: 'lên án gay gắt công khai', en: 'to publicly declare to be wrong', syn: ['condemn', 'criticize'] },
  derivative: { pos: 'adj.', vi: 'sao chép, phái sinh từ tác phẩm trước, thiếu sáng tạo', en: 'based on earlier work rather than wholly original', syn: ['imitative', 'unoriginal'] },
  derived: { pos: 'v.', vi: 'bắt nguồn từ, có nguồn gốc từ (derived from)', en: 'obtained or drawn from a source', syn: ['stemmed from', 'originated from'] },
  desultory: { pos: 'adj.', vi: 'rời rạc, thiếu kế hoạch, không có mục đích rõ ràng', en: 'lacking a plan, purpose, or enthusiasm', syn: ['aimless', 'haphazard'] },
  discern: { pos: 'v.', vi: 'nhận ra, nhìn thấu hoặc phân định rõ', en: 'to perceive or recognize something clearly', syn: ['perceive', 'detect', 'identify'] },
  discount: { pos: 'v.', vi: 'xem nhẹ, bỏ qua không đánh giá đúng mức', en: 'to regard a fact or subtlety as unworthy of consideration', syn: ['disregard', 'overlook', 'dismiss'] },
  disparage: { pos: 'v.', vi: 'coi thường, miệt thị, làm giảm uy tín', en: 'to regard or represent as being of little worth', syn: ['belittle', 'denigrate'] },
  disparity: { pos: 'n.', vi: 'sự chênh lệch lớn, sự bất bình đẳng', en: 'a large difference or inequality', syn: ['gap', 'inequality'] },
  dispassionate: { pos: 'adj.', vi: 'khách quan, điềm tĩnh, không bị cảm xúc chi phối', en: 'not influenced by strong emotion; calm and objective', syn: ['objective', 'detached', 'unemotional'] },
  dispel: { pos: 'v.', vi: 'xua tan, xóa bỏ hoàn toàn (nghi ngờ, nỗi sợ)', en: 'to make a doubt, feeling, or belief go away', syn: ['banish', 'eliminate'] },
  displayed: { pos: 'v.', vi: 'bộc lộ, thể hiện rõ ra ngoài (cảm xúc, thái độ)', en: 'showed a feeling or quality clearly', syn: ['exhibited', 'manifested'] },
  disregard: { pos: 'v.', vi: 'phớt lờ, bỏ qua không chú ý tới', en: 'to fail to notice or pay attention to', syn: ['overlook', 'ignore', 'neglect'] },
  disseminate: { pos: 'v.', vi: 'phổ biến, truyền bá rộng rãi (thông tin)', en: 'to spread or disperse information widely', syn: ['circulate', 'distribute'] },
  dissipate: { pos: 'v.', vi: 'tan biến dần, tiêu tán', en: 'to disappear or cause to disperse', syn: ['disperse', 'vanish'] },
  distort: { pos: 'v.', vi: 'bóp méo, làm sai lệch hình dạng hoặc sự thật', en: 'to twist out of shape or misrepresent', syn: ['warp', 'misrepresent'] },
  dynamic: { pos: 'adj.', vi: 'năng động, liên tục vận động và biến đổi', en: 'constantly changing, evolving, or developing', syn: ['evolving', 'changing', 'shifting'] },
  eccentric: { pos: 'adj.', vi: 'kỳ quặc, lập dị khác người', en: 'unconventional and slightly strange', syn: ['quirky', 'peculiar'] },
  eclipsed: { pos: 'v.', vi: 'làm lu mờ, vượt qua hoàn toàn về tầm vóc', en: 'surpassed or outshone completely', syn: ['surpassed', 'outshone', 'overshadowed'] },
  efficacy: { pos: 'n.', vi: 'tính hiệu quả, khả năng mang lại kết quả mong muốn', en: 'the ability to produce a desired or intended result', syn: ['effectiveness', 'potency'] },
  elasticity: { pos: 'n.', vi: 'tính linh hoạt, khả năng co giãn thích ứng cao', en: 'flexibility; the ability to adapt to varied circumstances', syn: ['flexibility', 'adaptability'] },
  eliciting: { pos: 'v.', vi: 'khơi gợi, dẫn dụ ra (phản hồi, nhu cầu thị trường)', en: 'drawing out or bringing about a response or demand', syn: ['evoking', 'drawing out', 'prompting'] },
  emblematic: { pos: 'adj.', vi: 'mang tính biểu tượng cho (emblematic of)', en: 'serving as a symbol of a particular quality', syn: ['symbolic', 'representative'] },
  enduring: { pos: 'adj.', vi: 'lâu bền, trường tồn mãi với thời gian', en: 'lasting over a long period of time', syn: ['lasting', 'abiding'] },
  engender: { pos: 'v.', vi: 'làm nảy sinh, sinh ra, gây ra (cảm giác, nhu cầu)', en: 'to cause or give rise to a feeling or situation', syn: ['cause', 'produce', 'generate'] },
  engendering: { pos: 'v.', vi: 'làm nảy sinh, tạo ra (nhu cầu, tình trạng)', en: 'causing or giving rise to', syn: ['generating', 'producing', 'sparking'] },
  entail: { pos: 'v.', vi: 'đòi hỏi tất yếu, kéo theo hệ quả', en: 'to involve something as a necessary part or consequence', syn: ['require', 'necessitate'] },
  enticed: { pos: 'v.', vi: 'bị thu hút, bị lôi cuốn/quyến rũ bởi', en: 'attracted or tempted by something appealing', syn: ['drawn', 'attracted', 'lured'] },
  enumerate: { pos: 'v.', vi: 'liệt kê, kiểm đếm từng mục một', en: 'to count or list items one by one', syn: ['count', 'tally', 'list'] },
  epitomized: { pos: 'v.', vi: 'là hiện thân tiêu biểu nhất của', en: 'been a perfect example of', syn: ['embodied', 'typified'] },
  equitable: { pos: 'adj.', vi: 'công bằng, bình đẳng hợp lý', en: 'fair and impartial', syn: ['fair', 'just'] },
  equivocal: { pos: 'adj.', vi: 'mập mờ, nước đôi, đa nghĩa', en: 'open to more than one interpretation; unclear', syn: ['ambiguous', 'vague'] },
  erratic: { pos: 'adj.', vi: 'thất thường, không đều đặn', en: 'not even or regular in pattern; unpredictable', syn: ['unpredictable', 'irregular'] },
  eschew: { pos: 'v.', vi: 'chủ động tránh xa, khước từ sử dụng', en: 'to deliberately avoid or reject', syn: ['avoid', 'shun', 'forgo'] },
  essential: { pos: 'adj.', vi: 'thiết yếu, cốt lõi không thể thiếu', en: 'absolutely necessary; extremely important', syn: ['vital', 'crucial', 'indispensable'] },
  esteem: { pos: 'n.', vi: 'sự kính trọng, lòng ngưỡng mộ yêu mến', en: 'respect and admiration for a person', syn: ['respect', 'admiration', 'regard'] },
  estimated: { pos: 'v.', vi: 'ước tính, phỏng đoán (độ tuổi, số lượng)', en: 'roughly calculated or judged the value, number, or age of', syn: ['approximated', 'gauged'] },
  evince: { pos: 'v.', vi: 'bộc lộ rõ ràng, cho thấy sự hiện diện của', en: 'to show clearly; reveal the presence of', syn: ['display', 'reveal', 'exhibit'] },
  evocative: { pos: 'adj.', vi: 'gợi nhớ, khơi gợi hình ảnh/cảm xúc (evocative of)', en: 'bringing strong images or memories to mind', syn: ['reminiscent', 'suggestive'] },
  exaggerate: { pos: 'v.', vi: 'phóng đại, cường điệu hóa quá sự thật', en: 'to represent something as greater than it really is', syn: ['overstate', 'inflate', 'magnify'] },
  exclusive: { pos: 'adj.', vi: 'độc quyền, dành riêng duy nhất cho (exclusive to)', en: 'restricted or limited to the single object concerned', syn: ['unique to', 'specific to'] },
  exemplar: { pos: 'n.', vi: 'hình mẫu lý tưởng, tấm gương điển hình', en: 'a model worth imitating; an excellent example', syn: ['model', 'paragon', 'ideal'] },
  exhibit: { pos: 'v.', vi: 'thể hiện, bộc lộ (đặc tính, yếu tố)', en: 'to show or display a quality or feature', syn: ['display', 'show', 'manifest'] },
  exhibition: { pos: 'n.', vi: 'màn phô diễn, cuộc trưng bày/triển lãm', en: 'a public display or spectacle', syn: ['display', 'spectacle'] },
  exorbitant: { pos: 'adj.', vi: 'đắt đỏ quá mức, cắt cổ (giá cả, phí cầu đường)', en: 'unreasonably high, especially of a price or toll', syn: ['excessive', 'outrageous', 'inflated'] },
  expected: { pos: 'v.', vi: 'được coi là điều bình thường/hiển nhiên bởi (expected by)', en: 'regarded as normal, standard, or likely by someone', syn: ['anticipated', 'assumed'] },
  expediting: { pos: 'v.', vi: 'đẩy nhanh tiến độ, xúc tiến', en: 'making a process happen sooner or faster', syn: ['accelerating', 'hastening'] },
  exploiting: { pos: 'v.', vi: 'khai thác, tận dụng tối đa lợi thế', en: 'making full use of and deriving benefit from', syn: ['utilizing', 'leveraging'] },
  extraneous: { pos: 'adj.', vi: 'không liên quan, ngoại lai từ bên ngoài', en: 'irrelevant or unrelated to the subject', syn: ['irrelevant', 'immaterial'] },
  facetious: { pos: 'adj.', vi: 'bỡn cợt, đùa cợt không đúng chỗ', en: 'treating serious issues with inappropriate humor', syn: ['flippant', 'frivolous'] },
  favorably: { pos: 'adv.', vi: 'một cách tán thành, tích cực, có thiện cảm', en: 'with approval; in a positive way', syn: ['approvingly', 'positively', 'well'] },
  feasible: { pos: 'adj.', vi: 'khả thi, có thể thực hiện được', en: 'possible to do; achievable', syn: ['possible', 'achievable', 'practicable'] },
  fecundity: { pos: 'n.', vi: 'khả năng sinh sản dồi dào; sức sáng tạo lớn', en: 'the ability to produce an abundance of offspring', syn: ['fertility', 'fruitfulness'] },
  forestalls: { pos: 'v.', vi: 'ngăn chặn trước bằng cách hành động sớm', en: 'prevents or obstructs by taking advance action', syn: ['precludes', 'averts'] },
  fortitude: { pos: 'n.', vi: 'lòng kiên cường, nghị lực chịu đựng nghịch cảnh', en: 'courage in pain or adversity', syn: ['resilience', 'endurance'] },
  fragile: { pos: 'adj.', vi: 'mỏng manh, dễ vỡ', en: 'easily broken or damaged; delicate', syn: ['delicate', 'frail'] },
  fraudulent: { pos: 'adj.', vi: 'gian lận, giả mạo lừa đảo', en: 'involving deception; fake or bogus', syn: ['spurious', 'fake', 'bogus'] },
  hallmark: { pos: 'n.', vi: 'dấu ấn đặc trưng, nét tiêu biểu giúp nhận diện', en: 'a distinctive, typical feature that identifies something', syn: ['trademark', 'signature'] },
  halting: { pos: 'v.', vi: 'chặn đứng, làm ngưng lại sự lây lan', en: 'stopping something from continuing or spreading', syn: ['stopping', 'checking', 'arresting'] },
  haphazard: { pos: 'adj.', vi: 'bừa bãi, ngẫu nhiên thiếu quy củ', en: 'lacking any obvious principle of organization', syn: ['random', 'unplanned'] },
  harbinger: { pos: 'n.', vi: 'điềm báo trước, dấu hiệu báo trước điều sắp xảy ra', en: 'a sign that something is coming; forerunner', syn: ['forerunner', 'precursor'] },
  heterogeneity: { pos: 'n.', vi: 'tính không đồng nhất, sự đa dạng khác biệt', en: 'the quality of being diverse in character', syn: ['diversity', 'variety'] },
  homogeneous: { pos: 'adj.', vi: 'đồng nhất, giống hệt nhau về tính chất', en: 'uniform; all of the same kind', syn: ['uniform', 'alike'] },
  honor: { pos: 'v.', vi: 'tôn vinh, vinh danh thành tựu công khai', en: 'to publicly recognize and show respect for achievements', syn: ['recognize', 'celebrate'] },
  identify: { pos: 'v.', vi: 'nhận diện, nhận ra cái gì đó là gì', en: 'to recognize what something is', syn: ['recognize', 'distinguish'] },
  idiosyncratic: { pos: 'adj.', vi: 'mang nét đặc thù/kỳ quặc cá nhân', en: 'peculiar or individual', syn: ['distinctive', 'eccentric'] },
  illuminate: { pos: 'v.', vi: 'làm sáng tỏ, giúp hiểu rõ một thời kỳ/vấn đề', en: 'to shed light on; make clearer or better understood', syn: ['elucidate', 'clarify', 'reveal'] },
  imaginable: { pos: 'adj.', vi: 'có thể tưởng tượng/hình dung ra được', en: 'possible to be thought of or believed', syn: ['conceivable', 'possible'] },
  imitate: { pos: 'v.', vi: 'bắt chước, mô phỏng theo phong cách', en: 'to copy or closely follow the style of something', syn: ['emulate', 'copy', 'mimic'] },
  imitation: { pos: 'n.', vi: 'sự bắt chước, bản mô phỏng theo phong cách', en: 'a copy or emulation of a style', syn: ['emulation', 'mimicry'] },
  immense: { pos: 'adj.', vi: 'bao la, khổng lồ, vô cùng rộng lớn', en: 'extremely large or great in scale or degree', syn: ['vast', 'enormous', 'massive'] },
  immutable: { pos: 'adj.', vi: 'bất biến, không bao giờ thay đổi', en: 'unchanging over time or unable to be changed', syn: ['fixed', 'unchangeable'] },
  impartiality: { pos: 'n.', vi: 'sự công tâm, thái độ khách quan không thiên vị', en: 'equal treatment of all sides; fairness', syn: ['neutrality', 'objectivity'] },
  imparts: { pos: 'v.', vi: 'truyền vào, ban cho, thổi một phẩm chất vào', en: 'bestows or conveys a quality to others', syn: ['conveys', 'instills', 'bestows'] },
  impeded: { pos: 'v.', vi: 'cản trở, làm chậm tiến trình', en: 'slowed down or blocked the progress of', syn: ['hindered', 'hampered'] },
  imperative: { pos: 'adj.', vi: 'cấp thiết, bắt buộc phải có đối với (imperative for)', en: 'absolutely necessary; essential', syn: ['essential', 'vital', 'crucial'] },
  impractical: { pos: 'adj.', vi: 'phi thực tế, không khả thi khi áp dụng', en: 'not sensible or realistic in practice', syn: ['unfeasible', 'unworkable'] },
  incongruity: { pos: 'n.', vi: 'sự mâu thuẫn kỳ lạ, sự bất hợp lý lệch pha', en: 'something that seems out of place or inconsistent; mismatch', syn: ['inconsistency', 'contradiction'] },
  incongruous: { pos: 'adj.', vi: 'không phù hợp, mâu thuẫn với (incongruous with)', en: 'not in keeping or consistent with', syn: ['inconsistent with', 'at odds with'] },
  inconsequential: { pos: 'adj.', vi: 'không quan trọng, không có ảnh hưởng đáng kể (inconsequential to)', en: 'not important or significant', syn: ['insignificant', 'trivial'] },
  indolence: { pos: 'n.', vi: 'sự lười biếng, tính uể oải thích nhàn rỗi', en: 'avoidance of activity or exertion; laziness', syn: ['laziness', 'sloth'] },
  induce: { pos: 'v.', vi: 'gây ra, kích thích dẫn đến', en: 'to cause or bring about', syn: ['stimulate', 'spur', 'generate'] },
  inertia: { pos: 'n.', vi: 'sự trì trệ, sức ỳ thụ động ngại thay đổi (consumer inertia)', en: 'a tendency to do nothing or to keep things as they are', syn: ['passivity', 'inaction', 'complacency'] },
  inestimable: { pos: 'adj.', vi: 'không thể ước tính/đo đếm được (vì thiếu dữ liệu)', en: 'impossible to estimate or calculate', syn: ['incalculable', 'unknowable'] },
  inexplicable: { pos: 'adj.', vi: 'không thể giải thích hay lý giải nổi', en: 'unable to be explained or accounted for', syn: ['unaccountable', 'baffling'] },
  infer: { pos: 'v.', vi: 'suy luận ra từ bằng chứng và dấu hiệu gián tiếp', en: 'to conclude something from evidence and reasoning', syn: ['deduce', 'conclude', 'determine'] },
  infinitesimal: { pos: 'adj.', vi: 'cực kỳ nhỏ bé, nhỏ tới mức vô cùng', en: 'extremely small', syn: ['microscopic', 'minuscule'] },
  influenced: { pos: 'v.', vi: 'bị ảnh hưởng, định hình bởi', en: 'affected or shaped how something develops', syn: ['shaped', 'affected'] },
  insurmountable: { pos: 'adj.', vi: 'không thể vượt qua nổi (rào cản, thử thách)', en: 'too great to be overcome; impossible to surmount', syn: ['insuperable', 'impossible'] },
  intangible: { pos: 'adj.', vi: 'vô hình, không thể chạm tay vào được', en: 'unable to be touched or grasped physically', syn: ['impalpable', 'incorporeal'] },
  integral: { pos: 'adj.', vi: 'thiết yếu, không thể tách rời khỏi tổng thể', en: 'necessary to make a whole complete; essential', syn: ['essential', 'fundamental', 'indispensable'] },
  interdependent: { pos: 'adj.', vi: 'phụ thuộc và tác động qua lại lẫn nhau', en: 'depending on each other; mutually influencing', syn: ['mutually dependent', 'interconnected'] },
  interrupting: { pos: 'v.', vi: 'làm gián đoạn, chặn đứt một quá trình đang diễn ra', en: 'stopping or breaking the continuation of a process', syn: ['halting', 'disrupting', 'breaking'] },
  jointly: { pos: 'adv.', vi: 'cùng nhau, đồng trao thưởng/đồng vận hành', en: 'together, with two or more people sharing', syn: ['together', 'collectively'] },
  locate: { pos: 'v.', vi: 'tìm ra, xác định được vị trí của ai/cái gì', en: 'to find; discover where something is', syn: ['find', 'pinpoint'] },
  magnify: { pos: 'v.', vi: 'phóng đại, làm lớn chuyện lên', en: 'to exaggerate; make something seem greater than it is', syn: ['exaggerate', 'overstate'] },
  magnitude: { pos: 'n.', vi: 'độ lớn, cấp độ mạnh yếu, quy mô', en: 'the great size, extent, or degree of something', syn: ['scale', 'extent', 'intensity'] },
  mandatory: { pos: 'adj.', vi: 'bắt buộc theo quy định', en: 'required by rules; compulsory', syn: ['compulsory', 'obligatory', 'required'] },
  manifest: { pos: 'adj.', vi: 'rõ ràng, hiển nhiên, dễ nhận thấy bằng giác quan', en: 'clearly visible or evident; plainly perceptible', syn: ['evident', 'apparent', 'perceptible'] },
  marks: { pos: 'v.', vi: 'ghi dấu, khắc dấu hoặc viết chữ ký lên bề mặt', en: 'cuts or writes letters, initials, or designs onto a surface', syn: ['inscribes', 'signs'] },
  material: { pos: 'adj.', vi: 'quan trọng thiết thực, có ảnh hưởng quyết định tới (material to)', en: 'important and relevant; having real influence on an outcome', syn: ['relevant to', 'significant to', 'consequential'] },
  measure: { pos: 'v.', vi: 'đo lường, đánh giá mức độ/tầm quan trọng', en: 'to judge or assess the extent or degree of a quality', syn: ['assess', 'gauge', 'evaluate'] },
  minimal: { pos: 'adj.', vi: 'tối thiểu, rất ít ỏi', en: 'very small in amount or number; the least possible', syn: ['scant', 'sparse', 'limited'] },
  misconstrue: { pos: 'v.', vi: 'hiểu sai, diễn giải lệch lạc ý nghĩa', en: 'to interpret wrongly', syn: ['misinterpret', 'misunderstand'] },
  mitigate: { pos: 'v.', vi: 'làm giảm nhẹ, khắc phục bớt mức độ nghiêm trọng', en: 'to lessen the severity or effect of a problem', syn: ['lessen', 'reduce', 'alleviate'] },
  modest: { pos: 'adj.', vi: 'khiêm tốn, vừa phải, số lượng nhỏ (modest array)', en: 'limited in size or amount; fairly small', syn: ['small', 'limited', 'moderate'] },
  mutable: { pos: 'adj.', vi: 'hay thay đổi, luôn biến đổi hình dạng', en: 'liable to change; constantly evolving', syn: ['changeable', 'dynamic', 'variable'] },
  nebulous: { pos: 'adj.', vi: 'mơ hồ, mù mờ như sương khói, chưa rõ nét', en: 'vague, indistinct, or ill-defined', syn: ['vague', 'hazy', 'unclear'] },
  neglect: { pos: 'v.', vi: 'bỏ bê, phớt lờ, không tính đến', en: 'to disregard or stop paying attention to something', syn: ['disregard', 'ignore', 'overlook'] },
  neglects: { pos: 'v.', vi: 'bỏ sót, phớt lờ không tính đến', en: 'fails to notice or include; overlooks', syn: ['overlooks', 'ignores', 'omits'] },
  nominal: { pos: 'adj.', vi: 'không đáng kể, rất nhỏ (chi phí/tác động)', en: 'very small; insignificant in amount or effect', syn: ['negligible', 'trivial', 'minimal'] },
  notional: { pos: 'adj.', vi: 'chỉ tồn tại trên ý niệm/lý thuyết (chưa có mẫu vật thực tế)', en: 'existing only in theory or as an idea', syn: ['hypothetical', 'theoretical', 'speculative'] },
  nullify: { pos: 'v.', vi: 'vô hiệu hóa, triệt tiêu hoàn toàn (lợi thế về giá)', en: 'to cancel out or make of no use or value', syn: ['cancel out', 'negate', 'neutralize'] },
  oddity: { pos: 'n.', vi: 'hiện tượng kỳ lạ, trường hợp ngoại lệ bất thường', en: 'an anomaly or unusual occurrence', syn: ['anomaly', 'aberration', 'rarity'] },
  ongoing: { pos: 'adj.', vi: 'vẫn đang tiếp diễn, còn nguyên giá trị tới hiện tại', en: 'continuing; still in progress or still in effect', syn: ['continuing', 'continuous'] },
  orthodox: { pos: 'adj.', vi: 'chính thống, theo quy chuẩn truyền thống lâu đời', en: 'conventional; following established, accepted standards', syn: ['conventional', 'traditional', 'established'] },
  outsized: { pos: 'adj.', vi: 'quá khổ, lớn vượt trội không cân xứng', en: 'exceptionally large; disproportionate', syn: ['disproportionate', 'enormous'] },
  overshadows: { pos: 'v.', vi: 'làm lu mờ, khiến cái khác trông kém quan trọng hơn', en: 'makes something seem less important by comparison', syn: ['eclipses', 'outshines'] },
  palpable: { pos: 'adj.', vi: 'hiện hữu rõ rệt, dễ dàng cảm nhận và nhìn thấy', en: 'plain to see or comprehend; noticeable', syn: ['perceptible', 'noticeable', 'tangible'] },
  paucity: { pos: 'n.', vi: 'sự ít ỏi, sự thiếu hụt khan hiếm (a paucity of)', en: 'a small or insufficient amount; scarcity', syn: ['scarcity', 'dearth', 'lack'] },
  perceptible: { pos: 'adj.', vi: 'có thể nhìn thấy, cảm nhận rõ bằng giác quan', en: 'able to be seen or noticed; manifest', syn: ['noticeable', 'visible', 'evident'] },
  perception: { pos: 'n.', vi: 'nhận thức, cách nhìn nhận/đánh giá của công chúng (perception of)', en: 'the way something is understood or regarded; an impression', syn: ['impression', 'view', 'understanding'] },
  permissible: { pos: 'adj.', vi: 'được phép, chấp nhận được theo quy ước', en: 'permitted; allowed', syn: ['allowed', 'optional', 'acceptable'] },
  perturbation: { pos: 'n.', vi: 'sự bất an, sự xáo trộn lo âu trong tâm trí', en: 'mental agitation or uneasiness', syn: ['agitation', 'unease', 'disquiet'] },
  pervasive: { pos: 'adj.', vi: 'lan tỏa khắp nơi, xuất hiện phổ biến rộng khắp', en: 'spreading widely throughout an area or language', syn: ['ubiquitous', 'widespread', 'prevalent'] },
  physical: { pos: 'adj.', vi: 'thuộc về vật chất hữu hình (hóa thạch, hiện vật)', en: 'relating to tangible, material objects', syn: ['material', 'tangible', 'concrete'] },
  popular: { pos: 'adj.', vi: 'phổ biến, được số đông người dùng ưa chuộng', en: 'commonly liked or practiced by many people', syn: ['common', 'widespread', 'prevailing'] },
  pranks: { pos: 'n.', vi: 'những trò chơi khăm, trò đùa tinh quái', en: 'tricks played on someone as a joke', syn: ['hoaxes', 'practical jokes'] },
  preceded: { pos: 'v.', vi: 'đi trước, xuất hiện trước về mặt thời gian', en: 'came before in time or order', syn: ['predated', 'antedated'] },
  precipitating: { pos: 'v.', vi: 'châm ngòi, làm bùng phát đột ngột (nhu cầu mua sắm)', en: 'causing an event or demand to happen suddenly', syn: ['triggering', 'sparking', 'inducing'] },
  preclude: { pos: 'v.', vi: 'ngăn chặn ngay từ đầu, loại trừ khả năng xảy ra', en: 'to prevent from happening; make impossible', syn: ['prevent', 'rule out'] },
  prevail: { pos: 'v.', vi: 'chiếm ưu thế, thắng thế hoàn toàn (prevail over)', en: 'to win out over; prove stronger or more important than', syn: ['outweigh', 'triumph over', 'surpass'] },
  prolific: { pos: 'adj.', vi: 'sáng tác dồi dào, năng suất cao, nở rộ', en: 'producing many works or results abundantly', syn: ['productive', 'abundant', 'fruitful'] },
  promote: { pos: 'v.', vi: 'quảng bá, giới thiệu rộng rãi tới công chúng', en: 'to publicize and bring public attention to', syn: ['publicize', 'showcase'] },
  proponent: { pos: 'n.', vi: 'người ủng hộ, người đề xướng một học thuyết/ý tưởng', en: 'a person who argues for or supports an idea or practice', syn: ['advocate', 'supporter', 'champion'] },
  provocative: { pos: 'adj.', vi: 'khiêu khích, dễ chọc giận hoặc gây tranh cãi', en: 'likely to provoke anger, offense, or controversy', syn: ['controversial', 'inflammatory', 'contentious'] },
  proxy: { pos: 'n.', vi: 'chỉ số đại diện, vật thay thế để đo lường gián tiếp', en: 'a stand-in used to represent or estimate something hard to measure directly', syn: ['stand-in', 'substitute', 'surrogate'] },
  realized: { pos: 'v.', vi: 'hiện thực hóa, đạt được trong thực tế', en: 'brought into concrete existence; achieved in practice', syn: ['achieved', 'fulfilled', 'actualized'] },
  reception: { pos: 'n.', vi: 'sự đón nhận của công chúng/giới phê bình (reception of)', en: 'the way in which a book or work is received by critics and readers', syn: ['response', 'reaction'] },
  recognized: { pos: 'v.', vi: 'công nhận, thừa nhận chính thức giá trị', en: 'acknowledged the existence, validity, or value of', syn: ['acknowledged', 'validated'] },
  recommended: { pos: 'v.', vi: 'giới thiệu, khuyên đọc, đánh giá cao', en: 'put forward with approval as being suitable or good', syn: ['endorsed', 'praised', 'suggested'] },
  rectify: { pos: 'v.', vi: 'sửa chữa, chấn chỉnh tình trạng bất công/thiếu sót', en: 'to correct or put right an undesirable situation', syn: ['correct', 'remedy', 'redress'] },
  rejected: { pos: 'v.', vi: 'bác bỏ, khước từ đi theo lối mòn cũ', en: 'refused to accept or follow a convention', syn: ['repudiated', 'spurned', 'renounced'] },
  relevant: { pos: 'adj.', vi: 'liên quan mật thiết, có giá trị áp dụng trực tiếp', en: 'closely connected or appropriate to what is being considered', syn: ['applicable', 'pertinent', 'germane'] },
  reliably: { pos: 'adv.', vi: 'một cách đáng tin cậy và chính xác ổn định', en: 'in a way that is consistently accurate and can be trusted', syn: ['consistently', 'dependably', 'accurately'] },
  relying: { pos: 'v.', vi: 'phụ thuộc vào, dựa vào (relying on)', en: 'depending on with full trust or confidence', syn: ['depending on', 'counting on'] },
  renewing: { pos: 'v.', vi: 'khôi phục, làm sống lại giá trị hữu ích đã phai nhạt', en: 'restoring or reviving something that had faded', syn: ['restoring', 'reviving', 'reinvigorating'] },
  replaced: { pos: 'v.', vi: 'thay thế (pin mới vào chỗ pin cũ)', en: 'put a new item in the place of an old or broken one', syn: ['swapped', 'substituted'] },
  repudiate: { pos: 'v.', vi: 'bác bỏ, cự tuyệt không chấp nhận', en: 'to refuse to accept or be associated with', syn: ['reject', 'renounce'] },
  revealed: { pos: 'v.', vi: 'tiết lộ, làm sáng tỏ điều trước đây chưa biết', en: 'made known or showed something previously hidden', syn: ['disclosed', 'uncovered', 'unveiled'] },
  rigor: { pos: 'n.', vi: 'tính nghiêm ngặt, sự chặt chẽ và chính xác trong nghiên cứu', en: 'careful thoroughness and precision in research or reasoning', syn: ['thoroughness', 'meticulousness', 'precision'] },
  sanguine: { pos: 'adj.', vi: 'lạc quan, tin tưởng tươi sáng', en: 'optimistic or positive, especially in a difficult situation', syn: ['optimistic', 'hopeful'] },
  solidified: { pos: 'v.', vi: 'củng cố vững chắc, khẳng định chắc chắn (vị thế)', en: 'made stronger and more secure', syn: ['cemented', 'strengthened', 'secured'] },
  solitary: { pos: 'adj.', vi: 'đơn độc một mình, làm việc riêng lẻ', en: 'existing, living, or acting alone, apart from others', syn: ['lone', 'single', 'unaccompanied'] },
  sporadically: { pos: 'adv.', vi: 'một cách lác đác, thất thường lúc có lúc không', en: 'at irregular intervals; only occasionally', syn: ['intermittently', 'infrequently'] },
  spurious: { pos: 'adj.', vi: 'giả mạo, ngụy tạo, không xác thực (tin giả)', en: 'not being what it purports to be; false or fake', syn: ['bogus', 'fake', 'fraudulent'] },
  stymie: { pos: 'v.', vi: 'cản trở, kìm hãm, làm bế tắc tiến trình tích lũy', en: 'to prevent or hinder the progress of', syn: ['impede', 'thwart', 'hamper'] },
  subside: { pos: 'v.', vi: 'lắng xuống, nguội dần đi, suy giảm (sự hào hứng)', en: 'to become less intense or severe; abate', syn: ['abate', 'wane', 'diminish'] },
  substantiate: { pos: 'v.', vi: 'chứng minh, xác thực một giả định bằng dữ liệu', en: 'to support or prove a claim with evidence', syn: ['verify', 'confirm', 'corroborate'] },
  superfluous: { pos: 'adj.', vi: 'dư thừa, vô bổ, không cần thiết', en: 'unnecessary, especially through being more than enough', syn: ['redundant', 'unnecessary'] },
  superior: { pos: 'adj.', vi: 'vượt trội hơn, tốt hơn về chất lượng/hiệu suất (superior to)', en: 'better in quality or performance than something else', syn: ['better than', 'surpassing'] },
  supplant: { pos: 'v.', vi: 'thay thế hoàn toàn, chiếm chỗ của người/cái cũ', en: 'to take the place of something or someone; replace', syn: ['replace', 'displace', 'supersede'] },
  support: { pos: 'v.', vi: 'cho phép, dung chứa được (nhiều cách hiểu khác nhau)', en: 'to allow for or be able to sustain several interpretations', syn: ['allow for', 'sustain', 'accommodate'] },
  tally: { pos: 'v.', vi: 'kiểm đếm, cộng tổng số lượng (lượt trích dẫn, phiếu bầu)', en: 'to count up or add up a total', syn: ['count', 'enumerate', 'total'] },
  traditional: { pos: 'adj.', vi: 'truyền thống, theo lối tiếp cận thông thường từ trước', en: 'following long-established practices or approaches', syn: ['conventional', 'orthodox', 'established'] },
  tranquil: { pos: 'adj.', vi: 'yên ả, thanh bình, tĩnh lặng (dòng nước êm)', en: 'free from disturbance; calm and peaceful', syn: ['calm', 'serene', 'peaceful'] },
  ubiquity: { pos: 'n.', vi: 'sự phổ biến khắp mọi nơi, sự hiện diện dày đặc', en: 'the fact of appearing everywhere or being very common', syn: ['omnipresence', 'pervasiveness'] },
  uncertain: { pos: 'adj.', vi: 'không chắc chắn, bấp bênh (vị trí trong ký ức lịch sử)', en: 'not completely confident or sure; precarious', syn: ['precarious', 'unsure', 'tenuous'] },
  undermine: { pos: 'v.', vi: 'làm suy yếu, làm lung lay nền tảng/vị thế', en: 'to weaken or damage a position or standing', syn: ['weaken', 'erode', 'subvert'] },
  underscores: { pos: 'v.', vi: 'nhấn mạnh, làm nổi bật tầm quan trọng', en: 'emphasizes or draws attention to', syn: ['emphasizes', 'highlights', 'stresses'] },
  unfailingly: { pos: 'adv.', vi: 'luôn luôn, lúc nào cũng vậy không bao giờ ngoại lệ', en: 'always, without ever failing or making an exception', syn: ['always', 'invariably', 'consistently'] },
  unknown: { pos: 'adj.', vi: 'chưa được biết tới, không thể biết chắc chắn', en: 'not known or familiar; impossible to know for certain', syn: ['uncertain', 'undetermined'] },
  unsympathetic: { pos: 'adj.', vi: 'không đồng tình, không ủng hộ (unsympathetic to)', en: 'unreceptive or opposed to an argument', syn: ['opposed to', 'unreceptive to'] },
  useless: { pos: 'adj.', vi: 'vô dụng, không còn xài được nữa', en: 'not fulfilling or not expected to achieve the intended purpose', syn: ['worthless', 'nonfunctional'] },
  validate: { pos: 'v.', vi: 'xác thực, chứng minh giả định là hoàn toàn đúng', en: 'to check or prove the validity or accuracy of', syn: ['confirm', 'substantiate', 'corroborate'] },
  value: { pos: 'v.', vi: 'coi trọng, trân trọng, đánh giá cao (công sức lao động)', en: 'to consider something important or worthwhile; appreciate', syn: ['appreciate', 'prize', 'respect'] },
  variable: { pos: 'adj.', vi: 'biến thiên, thay đổi khác nhau tùy ngành/trường hợp', en: 'not consistent or having a fixed pattern; liable to change', syn: ['changing', 'varying', 'inconsistent'] },
  varied: { pos: 'adj.', vi: 'đa dạng, phong phú nhiều thể loại khác nhau', en: 'made up of many different kinds; diverse', syn: ['diverse', 'multifaceted', 'assorted'] },
  visionary: { pos: 'adj.', vi: 'có tầm nhìn xa trông rộng, đi trước thời đại', en: 'showing original, imaginative ideas that anticipate the future', syn: ['forward-looking', 'prescient', 'prophetic'] },
  waste: { pos: 'n.', vi: 'rác thải (gây hại cho môi trường)', en: 'unwanted or unusable material discarded as trash', syn: ['trash', 'refuse', 'garbage'] },
  wrought: { pos: 'v.', vi: 'được gây ra bởi (damage wrought by = tổn hại gây ra bởi)', en: 'caused by or brought about by', syn: ['caused', 'inflicted', 'produced'] },
};

function lookupSatOptionMeaning(rawText) {
  if (!rawText) return null;
  const cleaned = String(rawText)
    .toLowerCase()
    .replace(/^(a|an|the|to)\s+/i, '')
    .replace(/[.,;?!"]/g, '')
    .trim();

  if (SAT_OPTION_LEXICON[cleaned]) return SAT_OPTION_LEXICON[cleaned];

  const firstToken = cleaned.split(/\s+/)[0];
  if (SAT_OPTION_LEXICON[firstToken]) return SAT_OPTION_LEXICON[firstToken];

  const candidates = [
    firstToken.replace(/ies$/, 'y'),
    firstToken.replace(/es$/, ''),
    firstToken.replace(/s$/, ''),
    firstToken.replace(/ed$/, ''),
    firstToken.replace(/ed$/, 'e'),
    firstToken.replace(/ing$/, ''),
    firstToken.replace(/ing$/, 'e'),
    firstToken.replace(/ly$/, ''),
  ];

  for (const cand of candidates) {
    if (cand.length >= 3 && SAT_OPTION_LEXICON[cand]) {
      return SAT_OPTION_LEXICON[cand];
    }
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Kho nội dung phân tích (TRAPS, DIFFICULTY_NOTES, STRATEGIES)               */
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
    headline: 'Đoán trước nghĩa trong ngữ cảnh, rồi đối chiếu 4 phương án',
    tips: [
      'Che các đáp án, tự đoán từ cần điền dựa vào mệnh đề sau dấu hai chấm (:), dấu gạch ngang (—) hoặc từ nối chuyển hướng.',
      'Khoanh các từ nối (however, therefore, although, while, instead): chúng quyết định từ cần điền cùng chiều hay ngược chiều với vế còn lại.',
      'Xem bảng giải nghĩa 4 đáp án A, B, C, D bên trên để loại ngay các phương án sai sắc thái (tích cực/tiêu cực) hoặc không khớp nghĩa.',
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
    headline: 'Chọn theo quy tắc, không chọn theo cảm giác',
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
      'Tìm manh mối then chốt trong đoạn: từ nối (however, although, because), dấu hai chấm (:), dấu gạch ngang (—) hoặc ví dụ đi kèm.',
      'Đối chiếu nghĩa của từng phương án A, B, C, D ở bảng trên và loại các phương án sai sắc thái hoặc không có manh mối hỗ trợ.',
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

  const enrichedOptions = options.map((opt) => {
    const isCorrectOpt = correctOption
      ? opt.label === correctOption.label
      : normalizeKey(opt.label) === normalizeKey(correctRaw);
    const isUserOpt = userOption ? opt.label === userOption.label : false;
    const lex = lookupSatOptionMeaning(opt.text);
    return {
      ...opt,
      isCorrectOpt,
      isUserOpt,
      lex,
    };
  });

  return {
    status,
    subject,
    domainKey,
    enrichedOptions,
    explanationText: toText(q.explanation || q.rationale),
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
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-6 select-none font-sans">
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
              SAT AI Co-Pilot • Pro Lexicon Edition
            </span>
            <h2 id="ai-tutor-modal-title" className="mt-1.5 text-lg font-semibold leading-snug text-slate-900">
              Giải nghĩa 4 phương án A, B, C, D & Phân tích tư duy giải nhanh
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

              {/* 0. MỤC NÂNG CẤP: GIẢI NGHĨA CHI TIẾT 4 PHƯƠNG ÁN A, B, C, D */}
              {analysis.enrichedOptions && analysis.enrichedOptions.length > 0 && (
                <SectionCard
                  icon={BookOpen}
                  tone="indigo"
                  title="Giải nghĩa 4 phương án A, B, C, D & Phân tích đáp án đúng"
                  subtitle="Option-by-option vocabulary & logical breakdown"
                >
                  <div className="space-y-3">
                    {analysis.enrichedOptions.map((opt) => (
                      <div
                        key={opt.label}
                        className={`rounded-2xl p-3.5 ring-1 transition ${
                          opt.isCorrectOpt
                            ? 'bg-emerald-50/90 ring-2 ring-emerald-500 text-slate-900'
                            : 'bg-slate-50/80 ring-slate-200/80 text-slate-800'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold shadow-xs ${
                              opt.isCorrectOpt
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white text-slate-800 ring-1 ring-slate-300'
                            }`}
                          >
                            {opt.label}
                          </span>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-slate-900 font-serif">
                                <MathRenderer text={opt.text} />
                              </span>
                              {opt.lex?.pos && (
                                <span className="rounded bg-indigo-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-indigo-700">
                                  {opt.lex.pos}
                                </span>
                              )}
                              {opt.isCorrectOpt ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Đáp án đúng
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100/80 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                                  <XCircle className="h-3 w-3" /> Phương án nhiễu
                                </span>
                              )}
                            </div>

                            {opt.lex ? (
                              <div className="space-y-1 text-xs leading-relaxed">
                                <p className="font-semibold text-slate-800">
                                  🇻🇳 Nghĩa chuẩn SAT:{' '}
                                  <span className="text-indigo-700 font-bold">{opt.lex.vi}</span>
                                </p>
                                {opt.lex.en && (
                                  <p className="italic text-slate-600">🇬🇧 EN: {opt.lex.en}</p>
                                )}
                                {opt.lex.syn && opt.lex.syn.length > 0 && (
                                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                                    <span className="text-[11px] font-semibold text-slate-500">
                                      Đồng nghĩa:
                                    </span>
                                    {opt.lex.syn.map((s, idx) => (
                                      <span
                                        key={idx}
                                        className="rounded bg-white px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-700 ring-1 ring-slate-200"
                                      >
                                        {s}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-600">
                                {opt.isCorrectOpt
                                  ? 'Phương án khớp chính xác với dấu hiệu ngữ cảnh và dữ kiện của đề bài.'
                                  : 'Phương án không khớp với dấu hiệu ngữ cảnh (Context Clue) hoặc sai lệch về mặt logic.'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {analysis.explanationText && (
                      <div className="mt-3 rounded-2xl bg-emerald-50/70 p-4 ring-1 ring-emerald-200">
                        <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1">
                          💡 Lập luận chi tiết tại sao chọn đáp án {analysis.correct.label}:
                        </p>
                        <div className="text-sm leading-relaxed text-slate-800 select-text">
                          <MathRenderer text={analysis.explanationText} />
                        </div>
                      </div>
                    )}
                  </div>
                </SectionCard>
              )}

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