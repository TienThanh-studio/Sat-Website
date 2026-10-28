// src/pages/VocabularyPage.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  BookOpen,
  Sparkles,
  Volume2,
  CheckCircle2,
  Brain,
  Layers,
  Play,
  Search,
  Award,
  Flame,
  XCircle,
  Filter,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Star,
  AlertTriangle,
} from 'lucide-react';
import rawVocabData from '../data/mockVocab.json';
import { storageService } from '../services/storageService';

const SET_SIZE = 25;

// ============================================================================
// BỘ DỮ LIỆU FLASHSAT 2025-2026 NHÚNG SẴN (TỰ ĐỘNG HỢP NHẤT & LỌC TRÙNG VỚI 20 SET CŨ)
// ============================================================================
const FLASHSAT_2026_EMBEDDED = [
  // --- LIST 1: 71 TỪ TOP-PRIORITY (34 TỪ SECTION A + 37 TỪ HIGH-FREQUENCY SECTION B, C, E) ---
  { word: 'critical', partOfSpeech: 'adj.', meaning: 'cực kỳ quan trọng, thiết yếu (khác với nghĩa chỉ trích)', definitionEn: 'extremely important; essential', example: 'Regular inspections are critical to keeping old bridges safe for heavy traffic.', synonyms: ['crucial', 'vital', 'essential'], priority: 'top', testCount: 6, seenOn: '6 kỳ thi (Mar 2025 – Jun 2026)', note: 'Bẫy đa nghĩa: Không chọn nghĩa phê phán/chỉ trích.' },
  { word: 'exorbitant', partOfSpeech: 'adj.', meaning: 'đắt đỏ quá mức, cắt cổ (giá cả, chi phí)', definitionEn: 'unreasonably high, especially of a price or cost', example: 'The startup could not afford the exorbitant rent charged for offices in the city center.', synonyms: ['excessive', 'outrageous', 'inflated'], priority: 'top', testCount: 5, seenOn: '5 kỳ thi (Aug 2025 – Oct 2026)' },
  { word: 'favorably', partOfSpeech: 'adv.', meaning: 'một cách tán thành, tích cực, thuận lợi', definitionEn: 'with approval; in a positive way', example: 'Most voters viewed the proposal favorably once they learned it would not raise taxes.', synonyms: ['approvingly', 'positively', 'well'], priority: 'top', testCount: 5, seenOn: '5 kỳ thi (Mar 2025 – Oct 2026)' },
  { word: 'proxy', partOfSpeech: 'n.', meaning: 'chỉ số đại diện, vật thay thế dùng để đo lường gián tiếp', definitionEn: 'a stand-in used to represent or estimate something hard to measure directly', example: 'Economists sometimes use satellite images of nighttime city lights as a proxy for economic activity.', synonyms: ['stand-in', 'substitute', 'surrogate'], priority: 'top', testCount: 5, seenOn: '5 kỳ thi (Aug 2025 – Jun 2026)', note: 'Trong khoa học SAT, proxy là thước đo gián tiếp (VD: vòng cây là proxy cho khí hậu quá khứ).' },
  { word: 'rigor', partOfSpeech: 'n.', meaning: 'sự chặt chẽ, tính nghiêm ngặt và chính xác (trong nghiên cứu)', definitionEn: 'careful thoroughness and precision, especially in research or reasoning', example: 'Reviewers questioned the rigor of the survey, which relied on only a dozen self-selected participants.', synonyms: ['thoroughness', 'meticulousness', 'precision'], priority: 'top', testCount: 5, seenOn: '5 kỳ thi (Mar 2025 – Sep 2026)' },
  { word: 'substantiate', partOfSpeech: 'v.', meaning: 'chứng minh, xác thực một tuyên bố bằng bằng chứng', definitionEn: 'to support or prove a claim with evidence', example: 'The historian substantiated her theory with tax records showing that the family had owned the land since 1820.', synonyms: ['verify', 'confirm', 'corroborate'], priority: 'top', testCount: 5, seenOn: '5 kỳ thi (Mar 2025 – May 2026)', note: 'Tránh nhầm với substitute (thay thế).' },
  { word: 'ubiquitous', partOfSpeech: 'adj.', meaning: 'phổ biến khắp mọi nơi, có mặt ở khắp nơi', definitionEn: 'found everywhere; extremely common', example: 'Once a luxury, air conditioning is now ubiquitous in American offices, schools, and shopping malls.', synonyms: ['omnipresent', 'pervasive', 'widespread'], priority: 'top', testCount: 5, seenOn: '5 kỳ thi (May 2025 – Mar 2026)' },
  { word: 'applaud', partOfSpeech: 'v.', meaning: 'tán dương, ca ngợi mạnh mẽ', definitionEn: 'to express strong approval of; to praise', example: "Environmental groups applauded the city's decision to ban single-use plastic bags.", synonyms: ['praise', 'commend', 'acclaim'], priority: 'top', testCount: 4, seenOn: '4 kỳ thi (Aug 2025 – Dec 2025)' },
  { word: 'disparity', partOfSpeech: 'n.', meaning: 'sự chênh lệch lớn, sự bất bình đẳng', definitionEn: 'a large difference or inequality', example: "There is a wide disparity between the salaries of the company's executives and its workers.", synonyms: ['gap', 'inequality', 'difference'], priority: 'top', testCount: 4, seenOn: '4 kỳ thi (Aug 2025 – Jun 2026)' },
  { word: 'exhibit', partOfSpeech: 'v.', meaning: 'bộc lộ, thể hiện (đặc tính, triệu chứng)', definitionEn: 'to show or display a quality or feature', example: 'Patients with the rare condition often exhibit symptoms that resemble the common flu.', synonyms: ['display', 'show', 'manifest'], priority: 'top', testCount: 4, seenOn: '4 kỳ thi (Mar 2025 – Jun 2026)' },
  { word: 'halt', partOfSpeech: 'v.', meaning: 'chặn đứng, làm ngưng lại', definitionEn: 'to stop something from continuing or spreading', example: 'A sudden shortage of steel halted construction on the new bridge for nearly six months.', synonyms: ['stop', 'check', 'arrest'], priority: 'top', testCount: 4, seenOn: '4 kỳ thi (Jun 2025 – Nov 2025)' },
  { word: 'populate', partOfSpeech: 'v.', meaning: 'đưa sinh vật vào sinh sống, làm đầy một khu vực', definitionEn: 'to fill or stock a place with living things', example: 'Biologists populated the newly dug pond with native frogs and insects to jump-start its ecosystem.', synonyms: ['stock', 'seed', 'inoculate'], priority: 'top', testCount: 4, seenOn: '4 kỳ thi (Aug 2025 – Sep 2026)' },
  { word: 'subdued', partOfSpeech: 'adj.', meaning: 'dịu đi, suy giảm cường độ, không dữ dội', definitionEn: 'mild or muted in strength or effect; not intense', example: 'The storm weakened over cold water, so its effects on the coast were far more subdued than forecasters had feared.', synonyms: ['muted', 'mild', 'modest'], priority: 'top', testCount: 4, seenOn: '4 kỳ thi (Jun 2025 – Nov 2025)' },
  { word: 'vary from', partOfSpeech: 'v. phr.', meaning: 'khác biệt so với', definitionEn: 'to be different from', example: 'Each regional dialect varies from the standard language in both vocabulary and pronunciation.', synonyms: ['differ from', 'diverge from', 'depart from'], priority: 'top', testCount: 4, seenOn: '4 kỳ thi (Aug 2025 – Mar 2026)' },
  { word: 'copious', partOfSpeech: 'adj.', meaning: 'dồi dào, phong phú, số lượng lớn', definitionEn: 'existing in large amounts; plentiful', example: 'The explorer kept copious records of every plant and insect she encountered on her journey.', synonyms: ['abundant', 'plentiful', 'numerous'], priority: 'top', testCount: 3, seenOn: '3 kỳ thi (Aug 2025 – Nov 2025)' },
  { word: 'denote', partOfSpeech: 'v.', meaning: 'biểu thị, chỉ ra, có nghĩa trực tiếp là', definitionEn: 'to indicate or mean; to be a sign of', example: 'In many cultures, a white flag denotes surrender or a wish to negotiate.', synonyms: ['signify', 'indicate', 'mean'], priority: 'top', testCount: 3, seenOn: '3 kỳ thi (Aug 2025 – Nov 2025)' },
  { word: 'differentiate', partOfSpeech: 'v.', meaning: 'phân biệt, nhận biết sự khác nhau', definitionEn: 'to recognize or show the difference between things', example: 'Experienced birders can differentiate the two sparrow species by their songs alone.', synonyms: ['distinguish', 'tell apart', 'discriminate'], priority: 'top', testCount: 3, seenOn: '3 kỳ thi (May 2026 – Sep 2026)' },
  { word: 'evaluate', partOfSpeech: 'v.', meaning: 'đánh giá, thẩm định độ hợp lý/thuyết phục', definitionEn: 'to judge how valid, sound, or convincing something is', example: "Jurors spent hours evaluating the witnesses' conflicting accounts of the accident.", synonyms: ['assess', 'appraise', 'judge'], priority: 'top', testCount: 3, seenOn: '3 kỳ thi (Aug 2026)' },
  { word: 'extemporaneous', partOfSpeech: 'adj.', meaning: 'ứng biến, tức thời, không chuẩn bị trước', definitionEn: 'done or spoken without preparation; improvised', example: 'Without a script, the guide gave an extemporaneous tour that was funnier than the official one.', synonyms: ['improvised', 'impromptu', 'unrehearsed'], priority: 'top', testCount: 3, seenOn: '3 kỳ thi (Aug 2025 – Nov 2025)' },
  { word: 'fictitious', partOfSpeech: 'adj.', meaning: 'bịa đặt, hư cấu, giả mạo', definitionEn: 'invented and presented as real; not true', example: 'The scammer gave a fictitious address, so the refund check never reached anyone.', synonyms: ['fake', 'invented', 'made-up'], priority: 'top', testCount: 3, seenOn: '3 kỳ thi (Aug 2025 – Nov 2025)' },
  { word: 'forecast', partOfSpeech: 'v.', meaning: 'dự báo, tiên đoán dựa trên dữ liệu hiện tại', definitionEn: 'to predict future conditions or events, often from current data', example: "Meteorologists can forecast a hurricane's general path days ahead, but its exact strength is much harder to judge.", synonyms: ['predict', 'project', 'anticipate'], priority: 'top', testCount: 3, seenOn: '3 kỳ thi (Aug 2025 – Nov 2025)' },
  { word: 'hallmark', partOfSpeech: 'n.', meaning: 'dấu ấn đặc trưng, nét tiêu biểu giúp nhận diện', definitionEn: 'a distinctive, typical feature that identifies something', example: "Bold colors and flattened perspective are hallmarks of the painter's later work, making her canvases easy to recognize.", synonyms: ['trademark', 'signature', 'distinguishing feature'], priority: 'top', testCount: 3, seenOn: '3 kỳ thi (Jun 2025 – Sep 2025)' },
  { word: 'honor', partOfSpeech: 'v.', meaning: 'tôn vinh, vinh danh thành tựu công khai', definitionEn: "to publicly recognize and show respect for someone's achievements", example: 'The city named its new library after the poet to honor her decades of teaching children to read.', synonyms: ['recognize', 'pay tribute to', 'celebrate'], priority: 'top', testCount: 3, seenOn: '3 kỳ thi (May 2025 – Nov 2025)' },
  { word: 'imitate', partOfSpeech: 'v.', meaning: 'bắt chước, mô phỏng theo phong cách', definitionEn: 'to copy or closely follow the style of something', example: 'Many early American government buildings imitate the columns and domes of ancient Greek and Roman temples.', synonyms: ['emulate', 'copy', 'mimic'], priority: 'top', testCount: 3, seenOn: '3 kỳ thi (Jun 2025 – Sep 2025)' },
  { word: 'integral', partOfSpeech: 'adj.', meaning: 'thiết yếu, không thể tách rời khỏi tổng thể', definitionEn: 'essential to the whole; necessary for completeness', example: 'Local volunteers are integral to the annual river cleanup, which could not happen without their labor.', synonyms: ['essential', 'fundamental', 'indispensable'], priority: 'top', testCount: 3, seenOn: '3 kỳ thi (Aug 2025 – Nov 2025)' },
  { word: 'laud', partOfSpeech: 'v.', meaning: 'ca ngợi hết lời, tán dương công khai', definitionEn: 'to praise highly, especially in public', example: 'Critics lauded the young novelist for her vivid portrayal of life in a small coastal fishing town.', synonyms: ['praise', 'acclaim', 'celebrate'], priority: 'top', testCount: 3, seenOn: '3 kỳ thi (Aug 2025 – Nov 2025)' },
  { word: 'multifariousness', partOfSpeech: 'n.', meaning: 'tính đa dạng, sự muôn hình vạn trạng', definitionEn: 'great variety or diversity of forms', example: "The multifariousness of the city's street food, from dumplings to tacos, surprised first-time visitors.", synonyms: ['diversity', 'variety', 'multiplicity'], priority: 'top', testCount: 3, seenOn: '3 kỳ thi (Aug 2025 – Mar 2026)' },
  { word: 'nominal', partOfSpeech: 'adj.', meaning: 'không đáng kể, rất nhỏ (về mức độ hoặc lệ phí)', definitionEn: 'very small; insignificant in amount or effect', example: "The repairs had only a nominal effect on the old car's fuel efficiency, improving it by less than one percent.", synonyms: ['negligible', 'trivial', 'insignificant'], priority: 'top', testCount: 3, seenOn: '3 kỳ thi (Dec 2025 – Aug 2026)' },
  { word: 'replicable', partOfSpeech: 'adj.', meaning: 'có thể lặp lại, có thể nhân rộng ở nơi khác', definitionEn: 'able to be repeated or successfully applied in other cases', example: 'Because the tutoring program cost so little, officials hoped it would be replicable in schools across the state.', synonyms: ['repeatable', 'reproducible', 'transferable'], priority: 'top', testCount: 3, seenOn: '3 kỳ thi (Aug 2025 – Nov 2025)' },
  { word: 'suggest', partOfSpeech: 'v.', meaning: 'cho thấy, biểu thị gián tiếp (không phải đề xuất)', definitionEn: 'to indicate or hint at without stating directly', example: 'The dark clouds gathering over the hills suggested that the picnic would soon be rained out.', synonyms: ['indicate', 'imply', 'hint at'], priority: 'top', testCount: 3, seenOn: '3 kỳ thi (Aug 2025 – Mar 2026)' },
  { word: 'supplement', partOfSpeech: 'v.', meaning: 'bổ sung, thêm vào để làm phong phú hơn', definitionEn: 'to add to something in order to complete or enrich it', example: 'Many long-distance hikers supplement their packaged meals with berries gathered along the trail.', synonyms: ['add to', 'augment', 'complement'], priority: 'top', testCount: 3, seenOn: '3 kỳ thi (Aug 2025 – Aug 2026)', note: 'Tránh nhầm với supplant (thay thế hoàn toàn).' },
  { word: 'sway', partOfSpeech: 'v.', meaning: 'thuyết phục, làm thay đổi quyết định của ai đó', definitionEn: "to persuade or influence someone's opinion or decision", example: 'No amount of flattery could sway the judge, who based her ruling strictly on the evidence.', synonyms: ['persuade', 'influence', 'win over'], priority: 'top', testCount: 3, seenOn: '3 kỳ thi (Oct 2025 – Sep 2026)' },
  { word: 'untenable', partOfSpeech: 'adj.', meaning: 'không thể bảo vệ/duy trì được nữa (lập luận, quan điểm)', definitionEn: 'no longer able to be defended or maintained, especially as a position or claim', example: "The official's claim that the bridge was safe became untenable after engineers found deep cracks in its supports.", synonyms: ['indefensible', 'unsupportable', 'unjustifiable'], priority: 'top', testCount: 3, seenOn: '3 kỳ thi (Aug 2025 – Mar 2026)' },
  { word: 'utility', partOfSpeech: 'n.', meaning: 'tính hữu dụng, giá trị thực tiễn', definitionEn: 'usefulness; the practical purposes something serves', example: 'The utility of duct tape extends far beyond sealing ducts, from patching tents to repairing shoes.', synonyms: ['usefulness', 'function', 'practical value'], priority: 'top', testCount: 3, seenOn: '3 kỳ thi (Aug 2025 – Nov 2025)' },

  // --- 37 TỪ TOP-PRIORITY NGHIÊN CỨU BỔ SUNG TỪ SECTION B, C, E (XUẤT HIỆN 2-8 KỲ THI) ---
  { word: 'manifest', partOfSpeech: 'adj.', meaning: 'rõ ràng, hiển nhiên, dễ nhận thấy', definitionEn: 'clearly visible or evident; plainly perceptible', example: 'Her relief was manifest the moment she saw her name printed at the top of the list.', synonyms: ['evident', 'apparent', 'plain'], priority: 'top', testCount: 7, seenOn: '7 kỳ thi (Mar 2025 – Jun 2026)', note: 'Xuất hiện 7 lần! Tránh nhầm với danh từ bản kê hàng hóa.' },
  { word: 'equivocal', partOfSpeech: 'adj.', meaning: 'mập mờ, nước đôi, đa nghĩa (thường là cố ý)', definitionEn: 'unclear or ambiguous, often deliberately', example: "Although the senator's statement was technically accurate, it was so equivocal that both supporters and opponents claimed she agreed with them.", synonyms: ['ambiguous', 'vague', 'noncommittal'], priority: 'top', testCount: 8, seenOn: '8 kỳ thi (Section E & F)' },
  { word: 'contentious', partOfSpeech: 'adj.', meaning: 'gây nhiều tranh cãi, bất đồng', definitionEn: 'likely to cause disagreement or controversy', example: 'The proposed highway route remained contentious among local residents for years.', synonyms: ['controversial', 'disputed', 'debatable'], priority: 'top', testCount: 6, seenOn: '6 kỳ thi' },
  { word: 'overshadow', partOfSpeech: 'v.', meaning: 'làm lu mờ, khiến cái khác trở nên kém quan trọng hơn', definitionEn: 'to make seem less important by comparison', example: "Caravaggio's notorious crime often overshadows his revolutionary contributions to European painting.", synonyms: ['eclipse', 'outshine', 'dwarf'], priority: 'top', testCount: 6, seenOn: '6 kỳ thi' },
  { word: 'analogous', partOfSpeech: 'adj.', meaning: 'tương đồng ở một số khía cạnh, có thể so sánh được', definitionEn: 'similar in some important way, allowing a comparison', example: 'The way a vaccine trains the immune system is analogous to a fire drill preparing students for emergencies.', synonyms: ['comparable', 'similar', 'akin'], priority: 'top', testCount: 5, seenOn: '5 kỳ thi' },
  { word: 'breathes', partOfSpeech: 'v.', meaning: 'truyền vào, thổi hồn/sức sống mới vào (nghĩa SAT)', definitionEn: 'imparts; instills or conveys a quality to others', example: 'Her steady leadership breathes new hope into volunteers who had nearly given up on the project.', synonyms: ['imparts', 'instills', 'infuses'], priority: 'top', testCount: 4, seenOn: '4 kỳ thi (Oct 2025 – Sep 2026)' },
  { word: 'traces', partOfSpeech: 'n.', meaning: 'dấu vết, dấu hiệu nhỏ còn sót lại', definitionEn: 'indications; small signs or marks left behind', example: 'Hikers found traces of an old campfire, blackened stones and bits of charcoal, near the river.', synonyms: ['indications', 'signs', 'vestiges'], priority: 'top', testCount: 4, seenOn: '4 kỳ thi (Nov 2025 – Oct 2026)' },
  { word: 'belie', partOfSpeech: 'v.', meaning: 'che giấu sự thật, tạo ấn tượng sai lệch về, mâu thuẫn với', definitionEn: 'to give a false or misleading impression of', example: "The building's plain brick exterior belies the lavish ballroom hidden inside.", synonyms: ['misrepresent', 'disguise', 'contradict'], priority: 'top', testCount: 3, seenOn: 'Nov 2025 (+Section F)', note: 'Bẫy kinh điển: belie KHÔNG phải là believe hay reveal.' },
  { word: 'define', partOfSpeech: 'v.', meaning: 'nhận diện rõ đường nét, phân định ranh giới bằng mắt', definitionEn: 'perceive; make out clearly, discern the outline or boundary of', example: 'In the dim light of the cave, we could barely define the edges of the narrow passage ahead.', synonyms: ['perceive', 'discern', 'make out'], priority: 'top', testCount: 3, seenOn: '3 kỳ thi (Sep 2025 – Oct 2026)' },
  { word: 'object', partOfSpeech: 'n.', meaning: 'mục đích, mục tiêu hướng tới (object in life = goal)', definitionEn: 'goal; purpose or aim', example: 'His chief object in moving to the city was to find steady work as a carpenter.', synonyms: ['goal', 'purpose', 'aim'], priority: 'top', testCount: 3, seenOn: '3 kỳ thi (Aug 2025 – Nov 2025)' },
  { word: 'ameliorate', partOfSpeech: 'v.', meaning: 'cải thiện, làm dịu bớt tình trạng xấu', definitionEn: 'to make a bad situation or effect better or less severe', example: 'The city opened cooling centers to ameliorate the dangers of the record-breaking heat wave.', synonyms: ['mitigate', 'alleviate', 'remedy'], priority: 'top', testCount: 2, seenOn: 'May 2025, Jun 2025' },
  { word: 'anomalous', partOfSpeech: 'adj.', meaning: 'bất thường, lệch chuẩn', definitionEn: 'different from what is normal or expected', example: "The astronomers rechecked their equipment after recording an anomalous spike in the star's brightness.", synonyms: ['atypical', 'irregular', 'aberrant'], priority: 'top', testCount: 2, seenOn: 'May 2025, Aug 2026' },
  { word: 'attest to', partOfSpeech: 'v. phr.', meaning: 'là bằng chứng rõ ràng cho, chứng thực', definitionEn: 'to serve as clear evidence of', example: "Thick layers of ash in the soil attest to the volcano's repeated eruptions over many centuries.", synonyms: ['demonstrate', 'confirm', 'bear witness to'], priority: 'top', testCount: 2, seenOn: 'Aug 2025, Nov 2025' },
  { word: 'attribute to', partOfSpeech: 'v. phr.', meaning: 'quy cho là do, cho rằng nguyên nhân là từ', definitionEn: 'to regard something as caused by a particular factor', example: "Doctors attributed the patient's quick recovery to her excellent physical condition before the surgery.", synonyms: ['ascribe to', 'credit to', 'put down to'], priority: 'top', testCount: 2, seenOn: 'Jun 2025, Dec 2025' },
  { word: 'complementary', partOfSpeech: 'adj.', meaning: 'bổ trợ lẫn nhau, bù đắp những gì bên kia thiếu', definitionEn: 'combining with something else so that each supplies what the other lacks', example: 'Her detailed sketches and his concise captions were complementary, together making the field guide easy to use.', synonyms: ['mutually supportive', 'mutually completing'], priority: 'top', testCount: 2, seenOn: 'Nov 2025, Dec 2025' },
  { word: 'conflate', partOfSpeech: 'v.', meaning: 'đánh đồng, nhầm lẫn hai khái niệm khác nhau làm một', definitionEn: 'to wrongly treat two distinct things as one and the same', example: 'Many people conflate loneliness with solitude, though one can enjoy being alone without feeling lonely.', synonyms: ['confuse', 'mix up', 'lump together'], priority: 'top', testCount: 2, seenOn: 'Jun 2025, Oct 2026' },
  { word: 'contingent on', partOfSpeech: 'adj. phr.', meaning: 'phụ thuộc vào, tùy thuộc vào điều kiện', definitionEn: 'depending on something else; determined by it', example: 'Whether the bridge is repaired this year is contingent on approval from the state budget office.', synonyms: ['dependent on', 'conditional on'], priority: 'top', testCount: 2, seenOn: 'Dec 2025, Jun 2026' },
  { word: 'convergence', partOfSpeech: 'n.', meaning: 'sự hội tụ, sự giao thoa cùng lúc', definitionEn: 'a coming together of separate things at the same time or place', example: "The town's harvest fair is a convergence of farmers, artisans, and musicians from across the valley.", synonyms: ['coincidence', 'meeting', 'conjunction'], priority: 'top', testCount: 2, seenOn: 'Oct 2025, Nov 2025' },
  { word: 'corroborate', partOfSpeech: 'v.', meaning: 'củng cố, xác nhận bằng bằng chứng bổ sung', definitionEn: 'to confirm or support with additional evidence', example: "Security footage corroborated the witness's account of when the truck left the warehouse.", synonyms: ['confirm', 'verify', 'substantiate'], priority: 'top', testCount: 2, seenOn: 'Mar 2025' },
  { word: 'discrepancy', partOfSpeech: 'n.', meaning: 'sự sai lệch, sự bất nhất giữa các số liệu/báo cáo', definitionEn: 'a difference or inconsistency between things being compared', example: "Auditors could not explain the discrepancy between the store's sales records and its inventory.", synonyms: ['inconsistency', 'difference', 'mismatch'], priority: 'top', testCount: 2, seenOn: 'Aug 2025, Jun 2026' },
  { word: 'exemplar', partOfSpeech: 'n.', meaning: 'hình mẫu lý tưởng, tấm gương điển hình', definitionEn: 'a model worth imitating; an excellent example', example: 'The restored mill is an exemplar of sustainable design, powered entirely by the river beside it.', synonyms: ['model', 'paragon', 'ideal'], priority: 'top', testCount: 2, seenOn: 'Jun 2025, Mar 2026' },
  { word: 'homogeneous', partOfSpeech: 'adj.', meaning: 'đồng nhất, giống hệt nhau về tính chất', definitionEn: 'uniform; all of the same kind or character', example: "Critics argued that the festival's lineup was too homogeneous, featuring bands that all sounded much the same.", synonyms: ['uniform', 'alike', 'undifferentiated'], priority: 'top', testCount: 2, seenOn: 'Jun 2025, Dec 2025' },
  { word: 'inimitable', partOfSpeech: 'adj.', meaning: 'độc nhất vô nhị, không thể bắt chước được', definitionEn: 'impossible to copy or imitate', example: "The comedian's timing was so inimitable that every actor who tried to impersonate him fell flat.", synonyms: ['beyond imitation', 'irreproducible'], priority: 'top', testCount: 2, seenOn: 'Dec 2025' },
  { word: 'interplay', partOfSpeech: 'n.', meaning: 'sự tương tác qua lại, sự tác động lẫn nhau', definitionEn: 'the way two or more things act on and affect each other', example: 'The novel explores the interplay between ambition and loyalty as two brothers compete for control.', synonyms: ['interaction', 'give-and-take'], priority: 'top', testCount: 2, seenOn: 'Nov 2025, Oct 2026' },
  { word: 'mitigate', partOfSpeech: 'v.', meaning: 'làm giảm nhẹ, làm dịu bớt mức độ nghiêm trọng', definitionEn: 'to lessen the severity or effect of a problem', example: 'Planting trees along city streets can mitigate the intense heat that builds up on summer afternoons.', synonyms: ['lessen', 'reduce', 'alleviate'], priority: 'top', testCount: 2, seenOn: 'Mar 2025' },
  { word: 'opaque', partOfSpeech: 'adj.', meaning: 'mờ đục; thiếu minh bạch, khó hiểu', definitionEn: 'not transparent; not open or clear about information', example: "The company's opaque hiring process left applicants guessing about why they had been rejected.", synonyms: ['secretive', 'unclear', 'nontransparent'], priority: 'top', testCount: 2, seenOn: 'Oct 2025, Nov 2025' },
  { word: 'prescient', partOfSpeech: 'adj.', meaning: 'có tầm nhìn xa, tiên tri chính xác tương lai', definitionEn: 'correctly anticipating future events', example: "The engineer's prescient warning about the dam's weak foundation was ignored until the flood proved her right.", synonyms: ['farsighted', 'prophetic', 'visionary'], priority: 'top', testCount: 2, seenOn: 'Nov 2025' },
  { word: 'proliferate', partOfSpeech: 'v.', meaning: 'sinh sôi, tăng trưởng và lan rộng nhanh chóng', definitionEn: 'to multiply or spread rapidly', example: 'Online review sites proliferated in the early 2000s, giving shoppers new ways to compare products.', synonyms: ['multiply', 'spread', 'flourish'], priority: 'top', testCount: 2, seenOn: 'Jun 2025, Nov 2025' },
  { word: 'proponent', partOfSpeech: 'n.', meaning: 'người ủng hộ, người đề xướng một học thuyết/ý tưởng', definitionEn: 'a person who argues for or supports an idea or practice', example: 'As a proponent of year-round schooling, the superintendent argued that long summer breaks make students forget lessons.', synonyms: ['advocate', 'supporter', 'champion'], priority: 'top', testCount: 2, seenOn: 'May 2025, Aug 2025' },
  { word: 'refute', partOfSpeech: 'v.', meaning: 'bác bỏ hoàn toàn, chứng minh một quan điểm là sai', definitionEn: 'to prove that a claim or belief is false', example: 'New measurements refuted the long-held assumption that the mountain glacier had remained stable for centuries.', synonyms: ['disprove', 'rebut', 'debunk'], priority: 'top', testCount: 2, seenOn: 'Mar 2026' },
  { word: 'salvage', partOfSpeech: 'v.', meaning: 'cứu vãn, thu hồi những gì còn dùng được sau thảm họa', definitionEn: 'to rescue something from loss, damage, or destruction so it can still be used', example: "After the flood, archivists worked for months to salvage letters soaked in the library's basement.", synonyms: ['rescue', 'recover', 'save'], priority: 'top', testCount: 2, seenOn: 'Aug 2025, Dec 2025' },
  { word: 'scope', partOfSpeech: 'n.', meaning: 'phạm vi, tầm bao quát của một nghiên cứu/tác phẩm', definitionEn: 'the breadth or range of what something covers or deals with', example: 'The scope of the new encyclopedia is remarkable, covering everything from ancient astronomy to modern robotics.', synonyms: ['range', 'breadth', 'extent'], priority: 'top', testCount: 2, seenOn: 'Aug 2025, Nov 2025' },
  { word: 'surmount', partOfSpeech: 'v.', meaning: 'vượt qua, khắc phục chướng ngại vật/khó khăn', definitionEn: 'to overcome a difficulty or obstacle', example: 'The young pianist surmounted a serious wrist injury to perform at the national competition.', synonyms: ['overcome', 'conquer', 'get past'], priority: 'top', testCount: 2, seenOn: 'Aug 2025, Nov 2025' },
  { word: 'synthesis', partOfSpeech: 'n.', meaning: 'sự tổng hợp, sự kết hợp hài hòa nhiều yếu tố', definitionEn: 'the combining of different elements into a single unified whole', example: "The chef's menu is a synthesis of Korean and Mexican cooking, best shown in her famous kimchi tacos.", synonyms: ['combination', 'fusion', 'blend'], priority: 'top', testCount: 2, seenOn: 'Aug 2025, Nov 2025' },
  { word: 'undermine', partOfSpeech: 'v.', meaning: 'làm suy yếu ngầm, làm lung lay nền tảng lý thuyết', definitionEn: 'to weaken or damage something, such as a position or theory, making it less secure', example: "Several errors in the footnotes undermined readers' trust in the author's otherwise careful research.", synonyms: ['weaken', 'erode', 'cast doubt on'], priority: 'top', testCount: 2, seenOn: 'Jun 2025, Nov 2025' },
  { word: 'underscore', partOfSpeech: 'v.', meaning: 'nhấn mạnh, làm nổi bật tầm quan trọng', definitionEn: 'to emphasize or draw attention to', example: 'The rising number of heat-related illnesses underscores the importance of shaded public spaces.', synonyms: ['emphasize', 'highlight', 'stress'], priority: 'top', testCount: 2, seenOn: 'Jun 2025' },
  { word: 'withhold', partOfSpeech: 'v.', meaning: 'giữ lại, từ chối tiết lộ hoặc cung cấp', definitionEn: 'to hold back or refuse to give, reveal, or provide', example: "The museum withheld the donor's name because she wished to remain anonymous.", synonyms: ['hold back', 'keep back', 'refrain from'], priority: 'top', testCount: 2, seenOn: 'Oct 2025, Nov 2025' },

  // --- LIST 2: CÁC TỪ CORE A-Z, MULTIPLE MEANINGS & DISTRACTORS TRONG SÁCH FLASHSAT ---
  { word: 'abate', partOfSpeech: 'v.', meaning: 'dịu bớt, suy giảm cường độ (bão, cơn sốt)', definitionEn: 'to become weaker or less intense; to lessen', example: 'Once the fever finally abated, the patient was able to sit up and eat a light meal.', synonyms: ['subside', 'diminish', 'weaken'], priority: 'standard', seenOn: 'Oct 2025' },
  { word: 'abiding', partOfSpeech: 'adj.', meaning: 'bền bỉ, lâu dài, vĩnh cửu', definitionEn: 'lasting a long time; permanent and not easily forgotten', example: "The scientist's abiding faith in careful observation shaped every experiment she designed over five decades.", synonyms: ['enduring', 'lasting', 'permanent'], priority: 'standard', seenOn: 'Mar 2026' },
  { word: 'abstain from', partOfSpeech: 'v. phr.', meaning: 'kiêng, chủ động tránh làm hoặc sử dụng gì đó', definitionEn: 'to deliberately avoid or hold back from using or doing something', example: 'For the entire month of training, the runner abstained from sugary drinks and fried food.', synonyms: ['refrain from', 'forgo', 'avoid'], priority: 'standard', seenOn: 'Oct 2026' },
  { word: 'accommodate', partOfSpeech: 'v.', meaning: 'đáp ứng, trù tính hoặc dành chỗ cho khả năng phát triển', definitionEn: 'to allow for or make room for something; to take it into account', example: 'The new library was designed to accommodate future growth, with empty shelves and space for another floor.', synonyms: ['allow for', 'provide for', 'take into account'], priority: 'standard', seenOn: 'Aug 2026' },
  { word: 'adept at', partOfSpeech: 'adj. phr.', meaning: 'thành thạo, điêu luyện trong việc gì', definitionEn: 'highly skilled at', example: 'After years of working at the market, she became adept at calculating change in her head.', synonyms: ['skilled at', 'proficient in', 'expert at'], priority: 'standard', seenOn: 'Sep 2026' },
  { word: 'adhere to', partOfSpeech: 'v. phr.', meaning: 'tuân thủ chặt chẽ, giữ vững (quy tắc, truyền thống)', definitionEn: 'to follow or stick closely to a practice, rule, or belief', example: "The bakery still adheres to the founder's original recipes, refusing to replace butter with cheaper oils.", synonyms: ['follow', 'stick to', 'abide by'], priority: 'standard', seenOn: 'Aug 2026' },
  { word: 'admonition', partOfSpeech: 'n.', meaning: 'lời cảnh báo, lời khuyên răn thận trọng', definitionEn: 'a warning or piece of cautionary advice', example: "The coach's admonitions about drinking enough water were ignored until two players fainted in the heat.", synonyms: ['warning', 'caution', 'reprimand'], priority: 'standard', seenOn: 'Oct 2026' },
  { word: 'affinity', partOfSpeech: 'n.', meaning: 'sự yêu thích tự nhiên, niềm đam mê gắn bó', definitionEn: 'a natural liking for or attraction to something', example: 'Raised near the harbor, she developed an early affinity for sailing and marine biology.', synonyms: ['liking', 'fondness', 'attraction'], priority: 'standard', seenOn: 'Aug 2025' },
  { word: 'amass', partOfSpeech: 'v.', meaning: 'tập hợp lại với số lượng lớn tại một nơi', definitionEn: 'to gather together in large numbers in one place', example: 'Each winter, millions of monarch butterflies amass in a handful of mountain forests in central Mexico.', synonyms: ['cluster', 'congregate', 'gather'], priority: 'standard', seenOn: 'Mar 2025, Dec 2025' },
  { word: 'amenable', partOfSpeech: 'adj.', meaning: 'có thể tiếp nhận/đáp ứng tốt với một phương pháp xử lý', definitionEn: 'able to be affected or dealt with by a particular process; responsive', example: 'Mild cases of the infection are usually amenable to treatment with rest and fluids.', synonyms: ['responsive', 'susceptible', 'open'], priority: 'standard', seenOn: 'Aug 2026' },
  { word: 'anecdotal', partOfSpeech: 'adj.', meaning: 'dựa trên giai thoại cá nhân (chưa kiểm chứng khoa học)', definitionEn: 'based on personal stories or reports rather than systematic evidence', example: 'Before the clinical trial, evidence that the herb relieved headaches was purely anecdotal.', synonyms: ['unsystematic', 'unverified', 'unscientific'], priority: 'standard', seenOn: 'Mar 2026' },
  { word: 'arbitrary', partOfSpeech: 'adj.', meaning: 'tùy tiện, cảm tính, không dựa trên lý lẽ', definitionEn: 'based on chance or personal whim rather than on reason', example: 'Students complained that the new dress code seemed arbitrary, banning some colors but not others.', synonyms: ['random', 'unjustified', 'capricious'], priority: 'standard', seenOn: 'Oct 2026' },
  { word: 'attrition', partOfSpeech: 'n.', meaning: 'sự hao hụt nhân sự dần dần theo thời gian', definitionEn: 'a gradual loss of members or participants as they leave or drop out', example: 'The hiking club shrank through attrition as members moved away and few newcomers joined.', synonyms: ['dropout', 'gradual loss', 'falling away'], priority: 'standard', seenOn: 'Aug 2025' },
  { word: 'augment', partOfSpeech: 'v.', meaning: 'làm tăng thêm, mở rộng quy mô/số lượng', definitionEn: 'to increase the size or amount of something', example: 'The museum augmented its small dinosaur collection with fossils borrowed from a nearby university.', synonyms: ['increase', 'boost', 'expand'], priority: 'standard', seenOn: 'Dec 2025' },
  { word: 'austerity', partOfSpeech: 'n.', meaning: 'hoàn cảnh thiếu thốn khắc nghiệt, sự giản dị nghiêm ngặt', definitionEn: 'harsh, difficult conditions of scarcity; severe plainness', example: 'Wartime austerity meant that families patched old clothes and grew vegetables in their yards.', synonyms: ['hardship', 'scarcity', 'severity'], priority: 'standard', seenOn: 'Oct 2026' },
  { word: 'byzantine', partOfSpeech: 'adj.', meaning: 'cực kỳ rắc rối, phức tạp và chồng chéo (thủ tục)', definitionEn: 'extremely complicated and intricate', example: "The city's byzantine permit process required eleven forms and visits to four separate offices.", synonyms: ['intricate', 'convoluted', 'labyrinthine'], priority: 'standard', seenOn: 'Sep 2026' },
  { word: 'catalyst', partOfSpeech: 'n.', meaning: 'chất xúc tác, tác nhân thúc đẩy sự thay đổi lớn', definitionEn: 'something that causes or speeds up an important change', example: 'The 1969 oil spill became a catalyst for the modern environmental movement in the United States.', synonyms: ['spur', 'stimulus', 'impetus'], priority: 'standard', seenOn: 'Nov 2025' },
  { word: 'clandestine', partOfSpeech: 'adj.', meaning: 'bí mật, lén lút, giấu kín', definitionEn: 'done secretly or kept hidden from others', example: 'During the war, the two scientists kept up a clandestine correspondence, passing letters through trusted friends.', synonyms: ['secret', 'covert', 'concealed'], priority: 'standard', seenOn: 'Nov 2025' },
  { word: 'conjectural', partOfSpeech: 'adj.', meaning: 'mang tính phỏng đoán, chưa có bằng chứng xác thực', definitionEn: 'based on guesswork or incomplete evidence rather than proof', example: "Because none of his letters survive, any account of the painter's early life remains conjectural.", synonyms: ['speculative', 'hypothetical', 'unproven'], priority: 'standard', seenOn: 'Oct 2026' },
  { word: 'consonance', partOfSpeech: 'n.', meaning: 'sự nhất quán, sự hòa hợp giữa hai yếu tố', definitionEn: 'agreement or harmony between things', example: "Voters noticed a striking consonance between the senator's public speeches and her private letters.", synonyms: ['harmony', 'agreement', 'accord'], priority: 'standard', seenOn: 'Nov 2025' },
  { word: 'counterfactual', partOfSpeech: 'adj.', meaning: 'giả định trái với thực tế đã xảy ra', definitionEn: 'imagining what would have happened if events had gone differently', example: 'Asking how history would differ if the printing press had never been invented is a counterfactual exercise.', synonyms: ['hypothetical', 'contrary-to-fact'], priority: 'standard', seenOn: 'Mar 2026' },
  { word: 'dearth', partOfSpeech: 'n.', meaning: 'sự khan hiếm, sự thiếu hụt trầm trọng', definitionEn: 'a scarcity or lack of something', example: 'The dearth of affordable housing has pushed many young families out of the city.', synonyms: ['shortage', 'scarcity', 'paucity'], priority: 'standard', seenOn: 'Mar 2025' },
  { word: 'derivative', partOfSpeech: 'adj.', meaning: 'sao chép, phái sinh từ tác phẩm đi trước, thiếu tính độc sáng', definitionEn: 'based on or drawn from earlier work rather than wholly original', example: "Critics dismissed the band's second album as derivative, little more than an echo of 1970s rock.", synonyms: ['imitative', 'unoriginal', 'borrowed'], priority: 'standard', seenOn: 'Mar 2026' },
  { word: 'diminutive', partOfSpeech: 'adj.', meaning: 'nhỏ nhắn, bé nhỏ khác thường', definitionEn: 'extremely or unusually small', example: 'Despite its diminutive size, the hummingbird migrates thousands of miles every year.', synonyms: ['tiny', 'minute', 'small'], priority: 'standard', seenOn: 'Mar 2025' },
  { word: 'discerning', partOfSpeech: 'adj.', meaning: 'sắc sảo, tinh tường trong việc đánh giá/tuyển chọn', definitionEn: 'showing good judgment, especially in choosing carefully', example: "The museum's discerning curators chose only twelve paintings from hundreds of submissions.", synonyms: ['selective', 'judicious', 'discriminating'], priority: 'standard', seenOn: 'Jun 2025' },
  { word: 'dispassionate', partOfSpeech: 'adj.', meaning: 'khách quan, điềm tĩnh, không bị cảm xúc chi phối', definitionEn: 'not influenced by strong emotion; calm and detached', example: 'The reporter gave a dispassionate account of the accident, sticking strictly to verifiable facts.', synonyms: ['detached', 'unemotional', 'objective'], priority: 'standard', seenOn: 'Mar 2025' },
  { word: 'dispel', partOfSpeech: 'v.', meaning: 'xua tan, xóa bỏ (nỗi sợ, sự nghi ngờ)', definitionEn: 'to make a belief, doubt, or feeling go away', example: "The teacher's calm explanation dispelled the students' fears about the final exam.", synonyms: ['banish', 'eliminate', 'put to rest'], priority: 'standard', seenOn: 'Nov 2025' },
  { word: 'efface', partOfSpeech: 'v.', meaning: 'xóa nhòa, làm lu mờ khiến không còn được chú ý', definitionEn: 'to erase or obscure something so it is no longer noticed', example: 'The official history effaced the contributions of the women who had run the factory during the war.', synonyms: ['erase', 'obscure', 'blot out'], priority: 'standard', seenOn: 'May 2026' },
  { word: 'elicit', partOfSpeech: 'v.', meaning: 'khơi gợi, dẫn dụ ra phản hồi/câu trả lời', definitionEn: 'to draw out or bring about a response or reaction', example: 'The survey questions were designed to elicit honest opinions about the new parking policy.', synonyms: ['evoke', 'draw out', 'prompt'], priority: 'standard', seenOn: 'Jun 2025' },
  { word: 'elude', partOfSpeech: 'v.', meaning: 'vượt ngoài tầm hiểu biết, làm đau đầu, lẩn tránh', definitionEn: 'to escape the understanding or grasp of; to evade', example: 'The answer to the riddle eluded the whole class until the teacher offered a hint.', synonyms: ['escape', 'evade', 'baffle'], priority: 'standard', seenOn: 'Sep 2026' },
  { word: 'engender', partOfSpeech: 'v.', meaning: 'gây ra, làm nảy sinh (tình trạng, cảm xúc)', definitionEn: 'to cause or give rise to', example: 'The sudden rule change engendered confusion among players and fans alike.', synonyms: ['cause', 'produce', 'give rise to'], priority: 'standard', seenOn: 'Nov 2025' },
  { word: 'enigmatic', partOfSpeech: 'adj.', meaning: 'bí ẩn, khó lý giải', definitionEn: 'mysterious and difficult to understand', example: 'The ancient stone circle remains enigmatic, since no one knows exactly who built it or why.', synonyms: ['mysterious', 'puzzling', 'inscrutable'], priority: 'standard', seenOn: 'Sep 2026' },
  { word: 'eschew', partOfSpeech: 'v.', meaning: 'chủ động tránh xa, khước từ sử dụng', definitionEn: 'to deliberately avoid or reject', example: 'Many minimalist poets eschew rhyme, preferring the plain rhythms of everyday speech.', synonyms: ['avoid', 'shun', 'forgo'], priority: 'standard', seenOn: 'Nov 2025' },
  { word: 'evince', partOfSpeech: 'v.', meaning: 'bộc lộ rõ ràng, cho thấy sự hiện diện của', definitionEn: 'to show clearly; to reveal the presence of', example: "The letters evince the author's deep affection for her younger brother.", synonyms: ['display', 'reveal', 'exhibit'], priority: 'standard', seenOn: 'Dec 2025' },
  { word: 'exacerbate', partOfSpeech: 'v.', meaning: 'làm trầm trọng thêm, làm xấu đi', definitionEn: 'to make a problem or bad situation worse', example: 'Skipping breakfast only exacerbated his headache during the long exam.', synonyms: ['worsen', 'aggravate', 'intensify'], priority: 'standard', seenOn: 'Aug 2026' },
  { word: 'exhaustiveness', partOfSpeech: 'n.', meaning: 'tính toàn diện, sự thấu đáo không bỏ sót chi tiết nào', definitionEn: 'the quality of covering every detail; completeness', example: 'The exhaustiveness of the investigation meant that no witness or document was overlooked.', synonyms: ['thoroughness', 'comprehensiveness', 'completeness'], priority: 'standard', seenOn: 'Jun 2025' },
  { word: 'feasible', partOfSpeech: 'adj.', meaning: 'khả thi, có thể thực hiện được', definitionEn: 'possible to do; achievable', example: 'With modern drilling equipment, building a tunnel under the bay finally became feasible.', synonyms: ['possible', 'achievable', 'practicable'], priority: 'standard', seenOn: 'May 2025' },
  { word: 'foreground', partOfSpeech: 'v.', meaning: 'đặt làm trọng tâm, làm nổi bật lên hàng đầu', definitionEn: 'to give something the most prominence; make it the central focus', example: 'The new history textbook foregrounds the experiences of ordinary farmers.', synonyms: ['highlight', 'emphasize', 'spotlight'], priority: 'standard', seenOn: 'May 2026' },
  { word: 'hamper', partOfSpeech: 'v.', meaning: 'cản trở, làm chậm tiến độ', definitionEn: 'to hinder or slow the progress of something', example: "Frequent power outages hampered the lab's efforts to keep its samples at a constant temperature.", synonyms: ['hinder', 'impede', 'obstruct'], priority: 'standard', seenOn: 'Jun 2025' },
  { word: 'heterogeneous', partOfSpeech: 'adj.', meaning: 'không đồng nhất, đa dạng nhiều thành phần khác nhau', definitionEn: 'varied; differing from one case or part to another', example: 'Student responses to the survey were heterogeneous, ranging from enthusiastic praise to sharp criticism.', synonyms: ['varied', 'diverse', 'dissimilar'], priority: 'standard', seenOn: 'Jun 2025' },
  { word: 'iconoclasm', partOfSpeech: 'n.', meaning: 'sự phá vỡ các quy chuẩn/truyền thống lâu đời', definitionEn: 'the attacking or rejecting of cherished traditions or revered things', example: "The young composer's iconoclasm delighted some critics and outraged others.", synonyms: ['irreverence', 'subversion'], priority: 'standard', seenOn: 'Mar 2026' },
  { word: 'imbue', partOfSpeech: 'v.', meaning: 'thấm nhuần, truyền đẫm một phẩm chất vào', definitionEn: 'to fill something with a quality; to give it that quality', example: 'The old craftsman imbued each chair with a sturdiness that let it last for generations.', synonyms: ['instill', 'infuse', 'endow'], priority: 'standard', seenOn: 'Aug 2026' },
  { word: 'incipient', partOfSpeech: 'adj.', meaning: 'mới chớm nở, đang ở giai đoạn đầu hình thành', definitionEn: 'beginning to happen or develop; in an early stage', example: 'The doctor caught the infection while it was still incipient, before any fever developed.', synonyms: ['emerging', 'nascent', 'initial'], priority: 'standard', seenOn: 'Oct 2026' },
  { word: 'incommensurate with', partOfSpeech: 'adj. phr.', meaning: 'không tương xứng với, lệch pha về tỷ lệ', definitionEn: 'out of proportion to, or not in keeping with, something', example: 'The modest praise she received seemed incommensurate with the years of work she had devoted.', synonyms: ['disproportionate to', 'out of keeping with'], priority: 'standard', seenOn: 'Dec 2025' },
  { word: 'incongruous with', partOfSpeech: 'adj. phr.', meaning: 'không phù hợp với, trái ngược với hoàn cảnh', definitionEn: 'not in keeping or consistent with', example: 'His cheerful whistling was incongruous with the somber mood of the memorial service.', synonyms: ['inconsistent with', 'at odds with'], priority: 'standard', seenOn: 'Aug 2026' },
  { word: 'inertia', partOfSpeech: 'n.', meaning: 'sự trì trệ, sức ỳ ngại thay đổi', definitionEn: 'a tendency to do nothing or to keep things as they are', example: 'Because of simple inertia, many people keep the same bank account for decades.', synonyms: ['passivity', 'inaction', 'complacency'], priority: 'standard', seenOn: 'May 2025' },
  { word: 'inestimable', partOfSpeech: 'adj.', meaning: 'không thể ước tính được (vì thiếu dữ liệu)', definitionEn: 'impossible to estimate or calculate', example: 'Because so few records survived the fire, the number of people living in the town that year is inestimable.', synonyms: ['incalculable', 'unknowable'], priority: 'standard', seenOn: 'May 2025' },
  { word: 'latitude', partOfSpeech: 'n.', meaning: 'quyền tự do hành động/lựa chọn linh hoạt', definitionEn: 'freedom to act or choose as one wishes', example: 'The new manager gives her staff wide latitude in deciding how to organize their work schedules.', synonyms: ['freedom', 'leeway', 'flexibility'], priority: 'standard', seenOn: 'Nov 2025' },
  { word: 'lethargy', partOfSpeech: 'n.', meaning: 'trạng thái uể oải, lờ đờ thiếu năng lượng', definitionEn: 'a state of sluggishness and lack of energy', example: 'After the long flight, a heavy lethargy kept her on the couch for most of the afternoon.', synonyms: ['sluggishness', 'torpor', 'listlessness'], priority: 'standard', seenOn: 'Sep 2026' },
  { word: 'loath', partOfSpeech: 'adj.', meaning: 'miễn cưỡng, không muốn làm gì (loath to)', definitionEn: 'unwilling; reluctant', example: 'Farmers are often loath to try new seeds until they have seen them succeed.', synonyms: ['reluctant', 'unwilling', 'disinclined'], priority: 'standard', seenOn: 'Aug 2026' },
  { word: 'meticulous', partOfSpeech: 'adj.', meaning: 'tỉ mỉ, cẩn trọng từng chi tiết nhỏ', definitionEn: 'extremely careful and precise, with close attention to detail', example: 'The accountant kept meticulous records, noting every single expense down to the last cent.', synonyms: ['careful', 'precise', 'painstaking'], priority: 'standard', seenOn: 'Jun 2026' },
  { word: 'myriad', partOfSpeech: 'adj.', meaning: 'vô số, muôn vàn', definitionEn: 'countless; extremely numerous', example: 'The festival offers myriad ways for visitors to sample regional food, music, and handmade crafts.', synonyms: ['countless', 'innumerable', 'numerous'], priority: 'standard', seenOn: 'Jun 2025' },
  { word: 'orthodox', partOfSpeech: 'adj.', meaning: 'chính thống, theo lối truyền thống chuẩn mực', definitionEn: 'conventional; following established, accepted standards', example: 'The chef rejected orthodox French techniques, preferring to invent his own methods.', synonyms: ['conventional', 'traditional', 'established'], priority: 'standard', seenOn: 'May 2025' },
  { word: 'paradigmatic of', partOfSpeech: 'adj. phr.', meaning: 'là mẫu hình tiêu biểu/điển hình cho', definitionEn: 'serving as a typical example or model of', example: "The small corner shop is paradigmatic of the city's neighborhood businesses.", synonyms: ['typical of', 'representative of'], priority: 'standard', seenOn: 'Sep 2026' },
  { word: 'paucity', partOfSpeech: 'n.', meaning: 'sự ít ỏi, sự khan hiếm dữ liệu/nguồn lực', definitionEn: 'a small or insufficient amount; scarcity', example: "A paucity of reliable data made it difficult for economists to measure the region's growth.", synonyms: ['scarcity', 'dearth', 'lack'], priority: 'standard', seenOn: 'May 2025' },
  { word: 'perfunctory', partOfSpeech: 'adj.', meaning: 'qua loa, chiếu lệ, làm cho xong chuyện', definitionEn: 'done quickly and without real care, interest, or depth', example: "The manager's perfunctory apology only made the customers angrier.", synonyms: ['cursory', 'superficial', 'half-hearted'], priority: 'standard', seenOn: 'Mar 2026' },
  { word: 'perturbation', partOfSpeech: 'n.', meaning: 'sự bất an, sự xáo trộn lo âu trong tâm trí', definitionEn: 'mental agitation or uneasiness', example: 'The unexplained delay caused the passengers visible perturbation.', synonyms: ['agitation', 'unease', 'disquiet'], priority: 'standard', seenOn: 'Mar 2025' },
  { word: 'pervade', partOfSpeech: 'v.', meaning: 'lan tỏa, thấm đẫm khắp mọi ngóc ngách', definitionEn: 'to spread throughout every part of something', example: 'A spirit of friendly competition pervades the science fair.', synonyms: ['permeate', 'run through', 'saturate'], priority: 'standard', seenOn: 'Aug 2025' },
  { word: 'precarious', partOfSpeech: 'adj.', meaning: 'bấp bênh, hiểm nghèo, thiếu an toàn', definitionEn: 'uncertain and insecure; at risk of failing', example: "With only a few weeks of savings, the family's finances became precarious.", synonyms: ['insecure', 'unstable', 'uncertain'], priority: 'standard', seenOn: 'Dec 2025' },
  { word: 'prevalent', partOfSpeech: 'adj.', meaning: 'phổ biến, thịnh hành trong một khu vực/nhóm cụ thể', definitionEn: 'widespread; common in a particular place or group', example: 'Allergies to ragweed are especially prevalent in the Midwest.', synonyms: ['widespread', 'common', 'predominant'], priority: 'standard', seenOn: 'Mar 2026' },
  { word: 'prudent', partOfSpeech: 'adj.', meaning: 'thận trọng, khôn ngoan để phòng ngừa rủi ro', definitionEn: 'wise and careful, especially about avoiding risk', example: 'Keeping an emergency fund is a prudent financial habit.', synonyms: ['wise', 'sensible', 'judicious'], priority: 'standard', seenOn: 'Mar 2025' },
  { word: 'quintessential', partOfSpeech: 'adj.', meaning: 'tinh túy nhất, điển hình hoàn hảo nhất cho', definitionEn: 'most typical or essential; representing the core of something', example: 'Fireflies blinking over a lawn are a quintessential image of summer evenings.', synonyms: ['classic', 'archetypal', 'defining'], priority: 'standard', seenOn: 'Aug 2025' },
  { word: 'reciprocal', partOfSpeech: 'adj.', meaning: 'có qua có lại, đôi bên cùng có lợi', definitionEn: 'involving give-and-take that benefits both sides; mutual', example: 'The two libraries have a reciprocal agreement that lets members borrow books from each other.', synonyms: ['mutual', 'two-way'], priority: 'standard', seenOn: 'Aug 2025' },
  { word: 'reconcile', partOfSpeech: 'v.', meaning: 'dung hòa hai ý tưởng/yêu cầu tưởng chừng đối lập', definitionEn: 'to make two apparently conflicting ideas or approaches fit together', example: "The architect struggled to reconcile the client's wish for huge windows with low heating costs.", synonyms: ['harmonize', 'square', 'integrate'], priority: 'standard', seenOn: 'Aug 2026' },
  { word: 'redress', partOfSpeech: 'v.', meaning: 'sửa chữa, đền bù cho một sự bất công/mất cân bằng', definitionEn: 'to correct or make up for an imbalance or wrong', example: 'The museum is redressing decades of neglect by adding works by women artists.', synonyms: ['correct', 'rectify', 'remedy'], priority: 'standard', seenOn: 'Jun 2025' },
  { word: 'satiate', partOfSpeech: 'v.', meaning: 'thỏa mãn hoàn toàn cơn thèm/nhu cầu', definitionEn: 'to satisfy a desire or appetite fully', example: "The bakery's huge menu has something to satiate every sweet tooth.", synonyms: ['satisfy', 'fulfill', 'gratify'], priority: 'standard', seenOn: 'Oct 2026' },
  { word: 'speculative', partOfSpeech: 'adj.', meaning: 'mang tính suy đoán lý thuyết, chưa có bằng chứng vững chắc', definitionEn: 'based on guesswork or theory rather than firm evidence', example: "Until the probe returned clear images, claims about ice at the planet's poles remained speculative.", synonyms: ['conjectural', 'hypothetical', 'unproven'], priority: 'standard', seenOn: 'Nov 2025' },
  { word: 'supplant', partOfSpeech: 'v.', meaning: 'thay thế hoàn toàn, chiếm chỗ của cái cũ', definitionEn: 'to take the place of something or someone; to replace', example: 'In many cities, ride-sharing apps have begun to supplant traditional taxi services.', synonyms: ['replace', 'displace', 'supersede'], priority: 'standard', seenOn: 'Mar 2025' },
  { word: 'surreptitiously', partOfSpeech: 'adv.', meaning: 'một cách lén lút, bí mật để tránh bị phát hiện', definitionEn: 'in a secret way, to avoid being noticed', example: 'The student surreptitiously slipped a note to her friend.', synonyms: ['secretly', 'covertly', 'stealthily'], priority: 'standard', seenOn: 'Nov 2025' },
  { word: 'surrogate', partOfSpeech: 'n.', meaning: 'vật thay thế dùng để đo lường gián tiếp', definitionEn: 'something used as a substitute or stand-in for something else', example: "Ecologists used the number of nests as a surrogate for the island's total bird population.", synonyms: ['substitute', 'stand-in', 'proxy'], priority: 'standard', seenOn: 'Dec 2025' },
  { word: 'tally', partOfSpeech: 'v.', meaning: 'kiểm đếm, cộng tổng số lượng', definitionEn: 'to count up or add up a total', example: "Organizers tallied the audience's votes to decide which team had been more convincing.", synonyms: ['count', 'add up', 'total'], priority: 'standard', seenOn: 'Mar 2025' },
  { word: 'tantamount to', partOfSpeech: 'adj. phr.', meaning: 'tương đương với, chẳng khác nào (về hậu quả)', definitionEn: 'equivalent in effect, meaning, or seriousness to', example: 'For the struggling farmers, a second year of drought would be tantamount to financial ruin.', synonyms: ['equivalent to', 'the same as'], priority: 'standard', seenOn: 'Mar 2026' },
  { word: 'temper', partOfSpeech: 'v.', meaning: 'làm dịu bớt, tiết chế một tuyên bố/cảm xúc quá đà', definitionEn: 'to moderate or qualify something, making it less extreme', example: 'Early enthusiasm for the new drug was tempered by reports of rare side effects.', synonyms: ['moderate', 'qualify', 'soften'], priority: 'standard', seenOn: 'Dec 2025' },
  { word: 'tenuous', partOfSpeech: 'adj.', meaning: 'mong manh, yếu ớt, thiếu căn cứ vững chắc', definitionEn: 'weak, slight, or insecure; easily lost or broken', example: 'The rebels held only a tenuous grip on the capital.', synonyms: ['weak', 'slight', 'insecure'], priority: 'standard', seenOn: 'Jun 2025' },
  { word: 'transcend', partOfSpeech: 'v.', meaning: 'vượt lên trên giới hạn thông thường', definitionEn: 'to go beyond the limits of something', example: "The novel's themes of loss and hope transcend its small-town setting.", synonyms: ['go beyond', 'surpass', 'exceed'], priority: 'standard', seenOn: 'Dec 2025' },
  { word: 'transience', partOfSpeech: 'n.', meaning: 'tính chất ngắn ngủi, sự phù du chóng tàn', definitionEn: 'the quality of lasting only a short time', example: 'The poet reflects on the transience of youth, comparing it to a single summer afternoon.', synonyms: ['impermanence', 'fleetingness'], priority: 'standard', seenOn: 'Dec 2025' },
  { word: 'visionary', partOfSpeech: 'adj.', meaning: 'có tầm nhìn xa trông rộng, đi trước thời đại', definitionEn: 'showing original, imaginative ideas that anticipate the future', example: 'Her visionary essays from the 1960s predicted online shopping decades before the internet existed.', synonyms: ['forward-looking', 'prescient'], priority: 'standard', seenOn: 'Mar 2025' },
];

function getBaseWordKey(wordStr) {
  return String(wordStr || '')
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .trim();
}

/**
 * Hợp nhất dữ liệu FlashSAT 2025-2026 với 20 Set ban đầu (mockVocab.json)
 * - Tự động loại bỏ các từ trong 20 Set cũ nếu đã xuất hiện trong FlashSAT
 * - Chia thành 2 danh sách rõ ràng theo đúng yêu cầu:
 *   + List 1 (topPriorityList): Các từ Top-Priority
 *   + List 2 (remainingStandardList): Các từ còn lại trong FlashSAT + các từ không trùng từ 20 Set cũ
 */
function buildTwoTierVocabCatalog(rawLegacy) {
  const seenKeys = new Set();
  const topPriorityList = [];
  const remainingStandardList = [];

  const legacyArr = Array.isArray(rawLegacy)
    ? rawLegacy
    : Array.isArray(rawLegacy?.words)
    ? rawLegacy.words
    : Array.isArray(rawLegacy?.data)
    ? rawLegacy.data
    : [];

  // Kiểm tra xem mockVocab.json đã được chạy script gộp chưa; nếu chưa thì dùng FLASHSAT_2026_EMBEDDED
  const combinedSource = [...FLASHSAT_2026_EMBEDDED, ...legacyArr];
  let removedDuplicatesCount = 0;

  combinedSource.forEach((item, idx) => {
    const w = item.word || item.term || '';
    const key = getBaseWordKey(w);
    if (!key) return;

    if (seenKeys.has(key)) {
      removedDuplicatesCount++;
      return; // Tự động bỏ qua từ trùng lặp ở 20 Set cũ
    }
    seenKeys.add(key);

    const isTop = item.priority === 'top';
    const normalized = {
      id: item.id || `voc_${isTop ? 'top' : 'std'}_${idx + 1}`,
      word: w,
      phonetic: item.phonetic || item.pronunciation || '',
      partOfSpeech: item.partOfSpeech || item.pos || item.type || 'v./adj.',
      meaning:
        item.meaning ||
        item.definition_vi ||
        item.translation ||
        item.definition ||
        '',
      definitionEn:
        item.definitionEn || item.definition_en || item.explanation || '',
      example:
        item.example ||
        item.context ||
        item.sentence ||
        'In academic contexts, this word frequently appears in Digital SAT passages.',
      synonyms: Array.isArray(item.synonyms)
        ? item.synonyms
        : typeof item.synonyms === 'string'
        ? item.synonyms
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      level: isTop ? 'TOP PRIORITY' : item.level || 'SAT CORE',
      priority: isTop ? 'top' : 'standard',
      testCount: item.testCount || 1,
      seenOn: item.seenOn || 'SAT Question Bank',
      note: item.note || '',
    };

    if (isTop) {
      topPriorityList.push(normalized);
    } else {
      remainingStandardList.push(normalized);
    }
  });

  return {
    topPriorityList,
    remainingStandardList,
    allWords: [...topPriorityList, ...remainingStandardList],
    removedDuplicatesCount,
  };
}

function computeNextSrsState(prevRecord, quality) {
  const now = Date.now();
  const prevReps = prevRecord?.reps || 0;
  const prevInterval = prevRecord?.intervalDays || 0;
  let ease = prevRecord?.ease || 2.5;

  let reps = prevReps;
  let intervalDays = 0;
  let nextReviewAt = now;
  let status = 'learning';

  if (quality === 1) {
    reps = 0;
    intervalDays = 0;
    ease = Math.max(1.3, ease - 0.2);
    nextReviewAt = now + 10 * 60 * 1000;
    status = 'learning';
  } else if (quality === 2) {
    reps = prevReps + 1;
    intervalDays =
      prevInterval === 0 ? 1 : Math.max(1, Math.round(prevInterval * 1.2));
    ease = Math.max(1.3, ease - 0.15);
    nextReviewAt = now + intervalDays * 86400 * 1000;
    status = 'learning';
  } else if (quality === 3) {
    reps = prevReps + 1;
    if (reps === 1) intervalDays = 1;
    else if (reps === 2) intervalDays = 3;
    else intervalDays = Math.round(prevInterval * ease);

    nextReviewAt = now + intervalDays * 86400 * 1000;
    status = intervalDays >= 7 ? 'mastered' : 'review';
  } else if (quality === 4) {
    reps = prevReps + 1;
    if (reps === 1) intervalDays = 4;
    else if (reps === 2) intervalDays = 7;
    else intervalDays = Math.round(prevInterval * ease * 1.3);

    ease = Math.min(3.0, ease + 0.15);
    nextReviewAt = now + intervalDays * 86400 * 1000;
    status = 'mastered';
  }

  return {
    reps,
    intervalDays,
    ease,
    lastReviewedAt: now,
    nextReviewAt,
    status,
  };
}

function buildClozeSentence(wordObj) {
  if (!wordObj) return '';
  const rawSentence = wordObj.example || '';
  const cleanWord = getBaseWordKey(wordObj.word).split(/\s+/)[0];

  if (
    rawSentence &&
    !rawSentence.includes('frequently appears in Digital SAT passages') &&
    cleanWord
  ) {
    const stem = cleanWord.length > 4 ? cleanWord.slice(0, -1) : cleanWord;
    const regex = new RegExp(`\\b${stem}[a-z]*\\b`, 'gi');
    if (regex.test(rawSentence)) {
      return rawSentence.replace(regex, '_______');
    }
  }

  const hint =
    wordObj.definitionEn ||
    (wordObj.synonyms?.length > 0
      ? `closely related in meaning to "${wordObj.synonyms.join(', ')}"`
      : `conveying the sense of "${wordObj.meaning}"`);

  return `During the scholarly symposium, the author's ${
    wordObj.partOfSpeech.includes('v')
      ? 'decision to _______ the established hypothesis'
      : '_______ approach to the historical evidence'
  } — ${hint} — sparked an intense debate among critics.`;
}

export default function VocabularyPage() {
  const catalog = useMemo(() => buildTwoTierVocabCatalog(rawVocabData), []);
  const {
    topPriorityList,
    remainingStandardList,
    allWords,
    removedDuplicatesCount,
  } = catalog;

  const [srsData, setSrsData] = useState(
    () => storageService.getVocabProgress() || {}
  );

  // Chia đúng 2 List theo yêu cầu của bạn:
  // 'top_priority' (List 1: Các từ Top-Priority) | 'standard_list' (List 2: Các từ còn lại đã lọc trùng)
  const [selectedListTab, setSelectedListTab] = useState('top_priority');
  const [viewMode, setViewMode] = useState('sets');
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [isDueReviewMode, setIsDueReviewMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [cardIdx, setCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFullscreenCard, setIsFullscreenCard] = useState(false);

  const [quizType, setQuizType] = useState('cloze');
  const [quizDeck, setQuizDeck] = useState([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizSelected, setQuizSelected] = useState(null);
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });
  const [quizFinished, setQuizFinished] = useState(false);

  const activeListWords = useMemo(() => {
    return selectedListTab === 'top_priority'
      ? topPriorityList
      : remainingStandardList;
  }, [selectedListTab, topPriorityList, remainingStandardList]);

  const vocabSets = useMemo(() => {
    const sets = [];
    const now = Date.now();
    const prefixTitle =
      selectedListTab === 'top_priority'
        ? '🔥 Top-Priority Set'
        : '📘 Core & Mở Rộng Set';

    for (let i = 0; i < activeListWords.length; i += SET_SIZE) {
      const slice = activeListWords.slice(i, i + SET_SIZE);
      const setNumber = Math.floor(i / SET_SIZE) + 1;

      let masteredCount = 0;
      let learningCount = 0;
      let dueCount = 0;

      slice.forEach((w) => {
        const rec = srsData[w.id];
        if (rec) {
          if (rec.status === 'mastered') masteredCount++;
          else learningCount++;
          if (rec.nextReviewAt && rec.nextReviewAt <= now) {
            dueCount++;
          }
        }
      });

      const newCount = slice.length - masteredCount - learningCount;
      const progressPct =
        slice.length > 0
          ? Math.round(
              ((masteredCount + learningCount * 0.5) / slice.length) * 100
            )
          : 0;

      sets.push({
        id: `${selectedListTab}_set_${setNumber}`,
        setNumber,
        title: `${prefixTitle} ${setNumber}`,
        rangeLabel: `Từ ${i + 1} – ${Math.min(
          i + SET_SIZE,
          activeListWords.length
        )}`,
        words: slice,
        total: slice.length,
        masteredCount,
        learningCount,
        newCount,
        dueCount,
        progressPct,
      });
    }
    return sets;
  }, [activeListWords, selectedListTab, srsData]);

  const dueWordsGlobal = useMemo(() => {
    const now = Date.now();
    return allWords.filter((w) => {
      const rec = srsData[w.id];
      return rec && rec.nextReviewAt && rec.nextReviewAt <= now;
    });
  }, [allWords, srsData]);

  const globalStats = useMemo(() => {
    let mastered = 0;
    let learning = 0;
    allWords.forEach((w) => {
      const st = srsData[w.id]?.status;
      if (st === 'mastered') mastered++;
      else if (st === 'learning' || st === 'review') learning++;
    });
    return {
      total: allWords.length,
      mastered,
      learning,
      unseen: Math.max(0, allWords.length - mastered - learning),
      dueNow: dueWordsGlobal.length,
    };
  }, [allWords, srsData, dueWordsGlobal]);

  const studyDeck = useMemo(() => {
    if (isDueReviewMode) {
      return dueWordsGlobal.length > 0
        ? dueWordsGlobal
        : vocabSets[activeSetIndex]?.words || [];
    }
    const baseWords =
      vocabSets[activeSetIndex]?.words || vocabSets[0]?.words || [];
    if (statusFilter === 'all') return baseWords;

    const now = Date.now();
    return baseWords.filter((w) => {
      const rec = srsData[w.id];
      if (statusFilter === 'new') return !rec;
      if (statusFilter === 'learning') return rec && rec.status !== 'mastered';
      if (statusFilter === 'mastered') return rec && rec.status === 'mastered';
      if (statusFilter === 'due') return rec && rec.nextReviewAt <= now;
      return true;
    });
  }, [
    isDueReviewMode,
    dueWordsGlobal,
    vocabSets,
    activeSetIndex,
    statusFilter,
    srsData,
  ]);

  const currentCard = studyDeck[cardIdx] || studyDeck[0];

  const activeQuizPool = quizDeck.length > 0 ? quizDeck : studyDeck;
  const currentQuizTargetId = activeQuizPool[quizIdx]?.id;

  const currentQuizQuestion = useMemo(() => {
    const target = allWords.find((w) => w.id === currentQuizTargetId);
    if (!target) return null;

    const distractors = allWords
      .filter((w) => w.id !== target.id && w.meaning)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    const choices = [target, ...distractors].sort(() => 0.5 - Math.random());
    const clozeSentence = buildClozeSentence(target);

    return {
      target,
      choices,
      clozeSentence,
    };
  }, [currentQuizTargetId, allWords]);

  const speakWord = (text, e) => {
    if (e) e.stopPropagation();
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const cleanText = String(text || '').replace(/\(.*?\)/g, '').trim();
    const utter = new SpeechSynthesisUtterance(cleanText);
    utter.lang = 'en-US';
    utter.rate = 0.92;
    window.speechSynthesis.speak(utter);
  };

  const handleRateCard = (quality) => {
    if (!currentCard) return;
    const prevRec = srsData[currentCard.id];
    const nextRec = computeNextSrsState(prevRec, quality);

    const updated = {
      ...srsData,
      [currentCard.id]: nextRec,
    };
    setSrsData(updated);
    storageService.saveVocabProgress(updated);

    if (isFlipped) {
      setIsFlipped(false);
      setTimeout(() => {
        setCardIdx((i) => (i < studyDeck.length - 1 ? i + 1 : 0));
      }, 220);
    } else {
      setCardIdx((i) => (i < studyDeck.length - 1 ? i + 1 : 0));
    }
  };

  const handlePrevCard = (e) => {
    if (e) e.stopPropagation();
    if (isFlipped) {
      setIsFlipped(false);
      setTimeout(() => {
        setCardIdx(
          (i) => (i - 1 + studyDeck.length) % Math.max(1, studyDeck.length)
        );
      }, 150);
    } else {
      setCardIdx(
        (i) => (i - 1 + studyDeck.length) % Math.max(1, studyDeck.length)
      );
    }
  };

  const handleNextCard = (e) => {
    if (e) e.stopPropagation();
    if (isFlipped) {
      setIsFlipped(false);
      setTimeout(() => {
        setCardIdx((i) => (i + 1) % Math.max(1, studyDeck.length));
      }, 150);
    } else {
      setCardIdx((i) => (i + 1) % Math.max(1, studyDeck.length));
    }
  };

  useEffect(() => {
    if (viewMode !== 'flashcard') return;
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (e.key === '1') {
        handleRateCard(1);
      } else if (e.key === '2') {
        handleRateCard(2);
      } else if (e.key === '3') {
        handleRateCard(3);
      } else if (e.key === '4') {
        handleRateCard(4);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setIsFullscreenCard((prev) => !prev);
      } else if (e.key === 'Escape' && isFullscreenCard) {
        setIsFullscreenCard(false);
      } else if (e.key === 'ArrowRight') {
        handleNextCard();
      } else if (e.key === 'ArrowLeft') {
        handlePrevCard();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  const handleSelectQuizOption = (choice) => {
    if (quizSelected || !currentQuizQuestion) return;
    setQuizSelected(choice.id);

    const target = currentQuizQuestion.target;
    const isCorrect = choice.id === target.id;

    const prevRec = srsData[target.id];
    const nextRec = computeNextSrsState(prevRec, isCorrect ? 3 : 1);
    const updated = {
      ...srsData,
      [target.id]: nextRec,
    };
    setSrsData(updated);
    storageService.saveVocabProgress(updated);

    setQuizScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const handleNextQuizQuestion = () => {
    setQuizSelected(null);
    if (quizIdx < activeQuizPool.length - 1) {
      setQuizIdx((i) => i + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const startSetStudy = (setIdx, mode = 'flashcard') => {
    const targetWords = vocabSets[setIdx]?.words || [];
    setIsDueReviewMode(false);
    setActiveSetIndex(setIdx);
    setStatusFilter('all');
    setCardIdx(0);
    setIsFlipped(false);
    setQuizDeck([...targetWords]);
    setQuizIdx(0);
    setQuizSelected(null);
    setQuizScore({ correct: 0, total: 0 });
    setQuizFinished(false);
    setViewMode(mode);
  };

  const startDueReviewSession = (mode = 'quiz') => {
    if (dueWordsGlobal.length === 0) {
      alert(
        'Tuyệt vời! Hiện tại bạn không có từ vựng nào đến hạn phải ôn tập.'
      );
      return;
    }
    const snapshotDue = [...dueWordsGlobal];
    setIsDueReviewMode(true);
    setCardIdx(0);
    setIsFlipped(false);
    setQuizDeck(snapshotDue);
    setQuizIdx(0);
    setQuizSelected(null);
    setQuizScore({ correct: 0, total: 0 });
    setQuizFinished(false);
    setViewMode(mode);
  };

  const formatNextReviewLabel = (wordId) => {
    const rec = srsData[wordId];
    if (!rec) return 'Chưa học';
    const diffMs = (rec.nextReviewAt || 0) - Date.now();
    if (diffMs <= 0) return '🔥 Đến hạn ôn ngay';
    const hours = Math.ceil(diffMs / (1000 * 3600));
    if (hours < 24) return `Ôn sau ${hours} giờ`;
    const days = Math.ceil(hours / 24);
    return `Ôn sau ${days} ngày`;
  };

  const renderFlashcardWorkspace = (isFull = false) => {
    if (!currentCard) return null;
    const progressPct =
      studyDeck.length > 0
        ? Math.round(((cardIdx + 1) / studyDeck.length) * 100)
        : 0;

    const content = (
      <div
        className={
          isFull
            ? 'fixed inset-0 z-[9999] w-screen h-screen bg-[#050811] text-slate-100 flex flex-col justify-between p-4 sm:p-6 overflow-hidden select-none font-sans'
            : 'max-w-3xl mx-auto space-y-5'
        }
      >
        <div className="w-full max-w-5xl mx-auto shrink-0 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/95 px-4 py-2.5 rounded-2xl border border-white/10 shadow-lg">
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-300 hidden sm:inline">Lọc thẻ:</span>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'new', label: 'Chưa học' },
                { id: 'learning', label: 'Đang học' },
                { id: 'due', label: 'Cần ôn lại' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setStatusFilter(f.id);
                    setCardIdx(0);
                    setIsFlipped(false);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition ${
                    statusFilter === f.id
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-cyan-300">
                Thẻ {cardIdx + 1}/{studyDeck.length} •{' '}
                {formatNextReviewLabel(currentCard.id)}
              </span>

              <button
                type="button"
                onClick={() => setIsFullscreenCard(!isFullscreenCard)}
                className="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-400/40 text-cyan-300 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition"
                title="Phím tắt: F hoặc Esc"
              >
                {isFull ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>Thu nhỏ (Esc)</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Toàn màn hình (F)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {isFull && (
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                style={{ width: `${progressPct}%` }}
                className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 transition-all duration-300"
              />
            </div>
          )}
        </div>

        <div
          className={`w-full max-w-5xl mx-auto flex items-center gap-3 sm:gap-5 ${
            isFull ? 'flex-1 min-h-0 py-3' : 'my-auto py-1'
          }`}
        >
          <button
            type="button"
            onClick={handlePrevCard}
            className="hidden sm:flex w-11 h-11 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-white/10 items-center justify-center text-slate-300 hover:text-white cursor-pointer transition shrink-0 shadow-lg"
            title="Thẻ trước (Phím ←)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div
            onClick={() => setIsFlipped(!isFlipped)}
            style={{ perspective: '1400px' }}
            className={`flex-1 cursor-pointer select-none ${
              isFull ? 'h-full max-h-[540px]' : 'h-[370px] sm:h-[395px]'
            }`}
          >
            <div
              style={{
                transformStyle: 'preserve-3d',
                transition: 'transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1)',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
              className="relative w-full h-full rounded-3xl shadow-2xl"
            >
              {/* MẶT TRƯỚC */}
              <div
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
                className="absolute inset-0 w-full h-full rounded-3xl bg-gradient-to-br from-[#0f172a] via-[#131d38] to-[#0f172a] border-2 border-indigo-500/40 hover:border-cyan-400/70 p-6 sm:p-10 flex flex-col justify-between shadow-[0_0_50px_rgba(30,58,138,0.25)]"
              >
                <div className="flex items-center justify-between shrink-0 gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold">
                      {vocabSets[activeSetIndex]?.title || 'FlashSAT'} •{' '}
                      {currentCard.partOfSpeech}
                    </span>
                    {currentCard.priority === 'top' && (
                      <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>TOP-PRIORITY</span>
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => speakWord(currentCard.word, e)}
                    className="p-2.5 rounded-full bg-slate-800 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 transition cursor-pointer"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="my-auto text-center space-y-3">
                  <h2
                    className={`font-black text-white tracking-tight ${
                      isFull
                        ? 'text-4xl sm:text-6xl'
                        : 'text-4xl sm:text-5xl'
                    }`}
                  >
                    {currentCard.word}
                  </h2>
                  {currentCard.phonetic && (
                    <p
                      className={`font-mono text-cyan-300 ${
                        isFull ? 'text-base sm:text-xl' : 'text-base'
                      }`}
                    >
                      {currentCard.phonetic}
                    </p>
                  )}
                  {currentCard.seenOn && (
                    <p className="text-xs font-mono text-amber-300/90">
                      📅 Tần suất: {currentCard.seenOn}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 pt-2">
                    (Bấm vào thẻ hoặc nhấn phím{' '}
                    <kbd className="px-2 py-0.5 bg-slate-800 border border-white/10 rounded text-slate-200">
                      Space
                    </kbd>{' '}
                    để lật thẻ 3D)
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/10 shrink-0">
                  <span>Phân hạng: {currentCard.level}</span>
                  <span className="text-cyan-400 font-semibold">
                    Mặt trước • Chạm để lật ↻
                  </span>
                </div>
              </div>

              {/* MẶT SAU */}
              <div
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
                className="absolute inset-0 w-full h-full rounded-3xl bg-gradient-to-br from-[#0d1f2d] via-[#111c35] to-[#0b1324] border-2 border-cyan-400/70 p-6 sm:p-9 flex flex-col justify-between overflow-y-auto shadow-[0_0_50px_rgba(34,211,238,0.15)]"
              >
                <div className="flex items-center justify-between shrink-0">
                  <span className="px-3.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-bold">
                    {currentCard.word} ({currentCard.partOfSpeech})
                  </span>

                  <button
                    type="button"
                    onClick={(e) => speakWord(currentCard.word, e)}
                    className="p-2 rounded-full bg-slate-800 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 transition cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="my-auto space-y-3 py-1">
                  <div>
                    <div className="text-[11px] font-bold uppercase text-cyan-400 tracking-wider">
                      Nghĩa chuẩn trong đề Digital SAT:
                    </div>
                    <div
                      className={`font-extrabold text-white mt-0.5 ${
                        isFull
                          ? 'text-2xl sm:text-3xl'
                          : 'text-xl sm:text-2xl'
                      }`}
                    >
                      {currentCard.meaning}
                    </div>
                  </div>

                  {currentCard.definitionEn && (
                    <p className="text-xs sm:text-sm text-slate-300 italic">
                      EN: {currentCard.definitionEn}
                    </p>
                  )}

                  <div className="p-3.5 rounded-2xl bg-slate-950/85 border border-white/10 space-y-1">
                    <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                      Câu ngữ cảnh SAT (FlashSAT 2025–2026):
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 font-serif leading-relaxed">
                      &ldquo;{currentCard.example}&rdquo;
                    </p>
                  </div>

                  {currentCard.note && (
                    <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-400/40 text-xs text-amber-200 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{currentCard.note}</span>
                    </div>
                  )}

                  {currentCard.synonyms?.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-400">
                        Đồng nghĩa SAT:
                      </span>
                      {currentCard.synonyms.map((syn, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold"
                        >
                          {syn}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/10 shrink-0">
                  <span>Seen on: {currentCard.seenOn}</span>
                  <span className="text-emerald-300 font-semibold">
                    Mặt sau • Chạm để úp lại ↺
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleNextCard}
            className="hidden sm:flex w-11 h-11 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-white/10 items-center justify-center text-slate-300 hover:text-white cursor-pointer transition shrink-0 shadow-lg"
            title="Thẻ tiếp theo (Phím →)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="w-full max-w-5xl mx-auto shrink-0 space-y-1.5">
          <div className="text-center text-[11px] text-slate-400 font-semibold">
            Đánh giá mức độ nhớ (Phím tắt{' '}
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">
              1
            </kbd>{' '}
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">
              2
            </kbd>{' '}
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">
              3
            </kbd>{' '}
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">
              4
            </kbd>
            ):
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => handleRateCard(1)}
              className="py-2.5 px-3 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-200 flex flex-col items-center gap-0.5 cursor-pointer transition"
            >
              <span className="text-xs font-black uppercase">
                1. Quên (Again)
              </span>
              <span className="text-[10px] font-mono text-rose-300">
                Lặp lại sau 10 phút
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleRateCard(2)}
              className="py-2.5 px-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-200 flex flex-col items-center gap-0.5 cursor-pointer transition"
            >
              <span className="text-xs font-black uppercase">
                2. Khó (Hard)
              </span>
              <span className="text-[10px] font-mono text-amber-300">
                Kiểm tra sau 1 ngày
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleRateCard(3)}
              className="py-2.5 px-3 rounded-2xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-200 flex flex-col items-center gap-0.5 cursor-pointer transition"
            >
              <span className="text-xs font-black uppercase">
                3. Nhớ (Good)
              </span>
              <span className="text-[10px] font-mono text-cyan-300">
                Kiểm tra sau 3–5 ngày
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleRateCard(4)}
              className="py-2.5 px-3 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-200 flex flex-col items-center gap-0.5 cursor-pointer transition"
            >
              <span className="text-xs font-black uppercase">
                4. Thuộc lòng (Easy)
              </span>
              <span className="text-[10px] font-mono text-emerald-300">
                Kiểm tra sau 7–14+ ngày
              </span>
            </button>
          </div>
        </div>
      </div>
    );

    if (isFull && typeof document !== 'undefined') {
      return createPortal(content, document.body);
    }
    return content;
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 select-none font-sans text-slate-100">
      {/* 1. BANNER TỔNG QUAN & CHỌN 2 LIST: TOP-PRIORITY LIST vs CÁC TỪ CÒN LẠI */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#0d152e] via-[#162044] to-[#0d152e] border border-indigo-500/30 p-6 lg:p-8 shadow-2xl overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-bold">
              <Brain className="w-3.5 h-3.5" />
              <span>
                FLASHSAT 2025–2026 • ĐÃ LỌC BỎ {removedDuplicatesCount} TỪ TRÙNG
                TRONG 20 SET CŨ
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              Hệ Thống Từ Vựng Thực Chiến Digital SAT
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Được chia thành <strong>2 Danh sách độc lập</strong>:{' '}
              <strong>List 1 (Top-Priority)</strong> gồm {topPriorityList.length}{' '}
              từ xuất hiện nhiều nhất qua các kỳ thi 2025–2026, và{' '}
              <strong>List 2 (Các từ còn lại)</strong> gồm{' '}
              {remainingStandardList.length} từ Core SAT đã khử sạch từ trùng với
              20 Set ban đầu.
            </p>
          </div>

          <div className="bg-slate-950/85 border border-amber-400/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 shrink-0 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                <Flame className="w-6 h-6 fill-amber-400/30" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  Cần ôn tập hôm nay
                </div>
                <div className="text-2xl font-black text-white font-mono">
                  {globalStats.dueNow}{' '}
                  <span className="text-xs font-sans font-semibold text-slate-400">
                    từ đến hạn
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => startDueReviewSession('quiz')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg cursor-pointer transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Kiểm tra ngay ({globalStats.dueNow})</span>
            </button>
          </div>
        </div>

        {/* 2 NÚT CHUYỂN ĐỔI GIỮA 2 LIST THEO ĐÚNG YÊU CẦU */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10">
          <button
            type="button"
            onClick={() => {
              setSelectedListTab('top_priority');
              setActiveSetIndex(0);
              setCardIdx(0);
              setViewMode('sets');
            }}
            className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer flex items-center justify-between ${
              selectedListTab === 'top_priority'
                ? 'bg-gradient-to-r from-amber-500/25 to-rose-500/20 border-amber-400 text-white shadow-lg'
                : 'bg-slate-900/70 border-white/10 text-slate-300 hover:bg-slate-900'
            }`}
          >
            <div>
              <div className="text-xs font-black uppercase text-amber-300 flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>LIST 1: TOP-PRIORITY VOCABULARY (ƯU TIÊN SỐ 1)</span>
              </div>
              <div className="text-xl font-black text-white mt-1">
                {topPriorityList.length} từ trọng điểm (
                {Math.ceil(topPriorityList.length / SET_SIZE)} Set)
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                34 từ High-Priority (Section A) + 37 từ tần suất cao & bẫy đa
                nghĩa nghiên cứu từ Section B, C, E
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedListTab('standard_list');
              setActiveSetIndex(0);
              setCardIdx(0);
              setViewMode('sets');
            }}
            className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer flex items-center justify-between ${
              selectedListTab === 'standard_list'
                ? 'bg-gradient-to-r from-cyan-500/25 to-blue-600/20 border-cyan-400 text-white shadow-lg'
                : 'bg-slate-900/70 border-white/10 text-slate-300 hover:bg-slate-900'
            }`}
          >
            <div>
              <div className="text-xs font-black uppercase text-cyan-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                <span>LIST 2: CÁC TỪ CÒN LẠI (CORE SAT & KHO ĐÃ LỌC TRÙNG)</span>
              </div>
              <div className="text-xl font-black text-white mt-1">
                {remainingStandardList.length} từ học thuật (
                {Math.ceil(remainingStandardList.length / SET_SIZE)} Set)
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                Toàn bộ từ A–Z còn lại trong FlashSAT + các từ không trùng lặp
                từ 20 Set ban đầu
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 2. THANH CHUYỂN ĐỔI CHẾ ĐỘ */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0b1021]/95 border border-indigo-500/25 rounded-2xl p-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsDueReviewMode(false);
              setViewMode('sets');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition ${
              viewMode === 'sets'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Danh sách {vocabSets.length} Set</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('flashcard')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition ${
              viewMode === 'flashcard'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>
              Học Flashcard (
              {isDueReviewMode
                ? 'Ôn từ đến hạn'
                : vocabSets[activeSetIndex]?.title || 'Set 1'}
              )
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!isDueReviewMode) {
                setQuizDeck([...(vocabSets[activeSetIndex]?.words || [])]);
              }
              setQuizIdx(0);
              setQuizSelected(null);
              setQuizScore({ correct: 0, total: 0 });
              setQuizFinished(false);
              setViewMode('quiz');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition ${
              viewMode === 'quiz'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>
              Kiểm tra SRS Quiz (
              {isDueReviewMode
                ? 'Từ đến hạn'
                : vocabSets[activeSetIndex]?.title || 'Set 1'}
              )
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition ${
              viewMode === 'list'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Bảng từ & Chu kỳ nhớ</span>
          </button>
        </div>

        {viewMode !== 'sets' && !isDueReviewMode && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Đang chọn:</span>
            <select
              value={activeSetIndex}
              onChange={(e) => startSetStudy(Number(e.target.value), viewMode)}
              className="bg-slate-950 border border-indigo-500/40 rounded-xl px-3 py-1.5 text-xs font-extrabold text-cyan-300 focus:outline-none cursor-pointer"
            >
              {vocabSets.map((s, idx) => (
                <option key={s.id} value={idx}>
                  {s.title} ({s.rangeLabel})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 3A. LƯỚI DANH SÁCH CÁC SET */}
      {viewMode === 'sets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {vocabSets.map((setItem, sIdx) => (
            <div
              key={setItem.id}
              className={`bg-[#0c1224]/95 hover:bg-[#101932] border rounded-3xl p-5 flex flex-col justify-between transition-all shadow-lg ${
                selectedListTab === 'top_priority'
                  ? 'border-amber-500/35 hover:border-amber-400'
                  : 'border-indigo-500/20 hover:border-cyan-400/50'
              }`}
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-3 py-1 rounded-xl font-mono text-xs font-black border ${
                      selectedListTab === 'top_priority'
                        ? 'bg-amber-500/15 border-amber-400/40 text-amber-300'
                        : 'bg-cyan-500/15 border-cyan-400/30 text-cyan-300'
                    }`}
                  >
                    {setItem.title}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {setItem.rangeLabel}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {setItem.words.slice(0, 5).map((w) => (
                    <span
                      key={w.id}
                      className="px-2 py-0.5 rounded-md bg-slate-900 border border-white/10 text-[11px] font-semibold text-slate-200"
                    >
                      {w.word}
                    </span>
                  ))}
                  <span className="px-2 py-0.5 text-[11px] text-slate-400 font-semibold">
                    +{Math.max(0, setItem.total - 5)} từ
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-1 text-center">
                  <div className="bg-slate-900/90 rounded-xl p-2 border border-white/5">
                    <div className="text-[10px] text-emerald-400 font-bold">
                      Thuộc
                    </div>
                    <div className="text-sm font-black text-white font-mono">
                      {setItem.masteredCount}
                    </div>
                  </div>
                  <div className="bg-slate-900/90 rounded-xl p-2 border border-white/5">
                    <div className="text-[10px] text-cyan-400 font-bold">
                      Đang học
                    </div>
                    <div className="text-sm font-black text-white font-mono">
                      {setItem.learningCount}
                    </div>
                  </div>
                  <div className="bg-slate-900/90 rounded-xl p-2 border border-white/5">
                    <div className="text-[10px] text-amber-400 font-bold">
                      Đến hạn
                    </div>
                    <div className="text-sm font-black text-amber-300 font-mono">
                      {setItem.dueCount}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-400">Tiến độ ghi nhớ</span>
                    <span className="text-cyan-300 font-mono">
                      {setItem.progressPct}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${setItem.progressPct}%` }}
                      className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-white/10 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => startSetStudy(sIdx, 'flashcard')}
                  className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition shadow"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Học Thẻ</span>
                </button>
                <button
                  type="button"
                  onClick={() => startSetStudy(sIdx, 'quiz')}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Test SRS</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3B. CHẾ ĐỘ FLASHCARD */}
      {viewMode === 'flashcard' && renderFlashcardWorkspace(isFullscreenCard)}

      {/* 3C. CHẾ ĐỘ QUIZ */}
      {viewMode === 'quiz' && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-2 flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-300 pl-2">
              Dạng bài kiểm tra:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setQuizType('cloze');
                  setQuizSelected(null);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition ${
                  quizType === 'cloze'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Điền từ Ngữ cảnh SAT (Cloze)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setQuizType('meaning');
                  setQuizSelected(null);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition ${
                  quizType === 'meaning'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Chọn Nghĩa Học Thuật</span>
              </button>
            </div>
          </div>

          {quizFinished ? (
            <div className="bg-[#0c1224] border border-indigo-500/30 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
              <Award className="w-14 h-14 text-amber-400 mx-auto" />
              <h2 className="text-2xl font-black text-white">
                Hoàn thành phiên kiểm tra Spaced Repetition!
              </h2>
              <p className="text-sm text-slate-300">
                Bạn trả lời đúng{' '}
                <strong className="text-emerald-400 font-mono text-base">
                  {quizScore.correct} / {quizScore.total}
                </strong>{' '}
                từ vựng.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => startSetStudy(activeSetIndex, 'quiz')}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold cursor-pointer"
                >
                  Làm lại Quiz Set này
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('sets')}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-extrabold cursor-pointer"
                >
                  Chọn Set tiếp theo
                </button>
              </div>
            </div>
          ) : currentQuizQuestion ? (
            <div className="bg-[#0c1224] border border-indigo-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 border-b border-white/10 pb-3">
                <span>
                  {isDueReviewMode
                    ? '🔥 Kiểm tra từ đến hạn'
                    : vocabSets[activeSetIndex]?.title || 'Quiz'}{' '}
                  • Câu {quizIdx + 1}/{activeQuizPool.length}
                </span>
                <span className="text-emerald-400 font-mono">
                  Đúng: {quizScore.correct}/{quizScore.total}
                </span>
              </div>

              {quizType === 'cloze' ? (
                <div className="space-y-4 py-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-[11px] font-bold">
                    <span>SAT WORDS IN CONTEXT • CLOZE PASSAGE</span>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-950/90 border border-indigo-500/30 text-base sm:text-lg font-serif text-slate-100 leading-relaxed">
                    &ldquo;{currentQuizQuestion.clozeSentence}&rdquo;
                  </div>

                  <p className="text-xs font-bold text-slate-300">
                    Which choice completes the text with the most logical and
                    precise word? (Gợi ý:{' '}
                    <span className="text-amber-300">
                      {currentQuizQuestion.target.meaning}
                    </span>
                    )
                  </p>
                </div>
              ) : (
                <div className="space-y-2 text-center py-3">
                  <span className="text-xs font-bold uppercase text-cyan-400">
                    Chọn nghĩa chính xác nhất của từ:
                  </span>
                  <div className="flex items-center justify-center gap-3">
                    <h3 className="text-3xl sm:text-4xl font-black text-white">
                      {currentQuizQuestion.target.word}
                    </h3>
                    <button
                      type="button"
                      onClick={() => speakWord(currentQuizQuestion.target.word)}
                      className="p-2 rounded-full bg-slate-800 text-cyan-300 hover:bg-slate-700 cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 font-serif italic max-w-lg mx-auto pt-1">
                    &ldquo;{currentQuizQuestion.target.example}&rdquo;
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {currentQuizQuestion.choices.map((opt, idx) => {
                  const isCorrectOpt =
                    opt.id === currentQuizQuestion.target.id;
                  const isChosen = quizSelected === opt.id;

                  let btnStyle =
                    'bg-slate-900/90 border-slate-700 text-slate-200 hover:border-cyan-400/60';
                  if (quizSelected) {
                    if (isCorrectOpt) {
                      btnStyle =
                        'bg-emerald-950/60 border-2 border-emerald-400 text-white';
                    } else if (isChosen && !isCorrectOpt) {
                      btnStyle =
                        'bg-rose-950/60 border-2 border-rose-500 text-rose-200';
                    }
                  }

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectQuizOption(opt)}
                      className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between gap-3 transition cursor-pointer ${btnStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-slate-800 font-mono text-xs font-bold flex items-center justify-center">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        {quizType === 'cloze' ? (
                          <div>
                            <span className="text-base font-extrabold font-serif">
                              {opt.word}
                            </span>
                            {quizSelected && (
                              <span className="ml-2 text-xs text-slate-300">
                                ({opt.meaning})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm font-bold">
                            {opt.meaning}
                          </span>
                        )}
                      </div>
                      {quizSelected && isCorrectOpt && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      )}
                      {quizSelected && isChosen && !isCorrectOpt && (
                        <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {quizSelected && (
                <div className="pt-2 flex items-center justify-between">
                  <div className="text-xs text-slate-300">
                    Đáp án:{' '}
                    <strong className="text-cyan-300">
                      {currentQuizQuestion.target.word}
                    </strong>{' '}
                    = {currentQuizQuestion.target.meaning}
                  </div>
                  <button
                    type="button"
                    onClick={handleNextQuizQuestion}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold cursor-pointer"
                  >
                    {quizIdx < activeQuizPool.length - 1
                      ? 'Câu tiếp theo →'
                      : 'Xem kết quả'}
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* 3D. CHẾ ĐỘ BẢNG TRA CỨU */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm trong toàn bộ kho từ (VD: proxy, belie, ubiquitous)..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="bg-[#0c1224] border border-indigo-500/20 rounded-3xl overflow-hidden">
            <div className="grid grid-cols-12 gap-3 px-6 py-3.5 bg-slate-900/90 border-b border-white/10 text-[11px] font-extrabold text-slate-400 uppercase">
              <div className="col-span-3">Từ vựng & Phân nhóm</div>
              <div className="col-span-4">Nghĩa chuẩn SAT</div>
              <div className="col-span-3">Lịch Spaced Repetition</div>
              <div className="col-span-2 text-right">Đánh dấu nhanh</div>
            </div>

            <div className="divide-y divide-white/5 max-h-[540px] overflow-y-auto">
              {(searchQuery.trim()
                ? allWords.filter(
                    (w) =>
                      w.word
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                      w.meaning
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())
                  )
                : activeListWords
              ).map((w) => {
                const rec = srsData[w.id];
                return (
                  <div
                    key={w.id}
                    className="grid grid-cols-12 gap-3 px-6 py-3.5 items-center hover:bg-white/5 text-xs"
                  >
                    <div className="col-span-3 font-extrabold text-white flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => speakWord(w.word)}
                        className="text-cyan-400 hover:text-cyan-300 cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <div>
                        <span>{w.word}</span>
                        {w.priority === 'top' && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-mono">
                            TOP
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="col-span-4 text-slate-300">{w.meaning}</div>
                    <div className="col-span-3 font-mono text-[11px]">
                      <span
                        className={`px-2.5 py-1 rounded-full ${
                          rec?.status === 'mastered'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : rec
                            ? 'bg-amber-500/15 text-amber-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {formatNextReviewLabel(w.id)}
                      </span>
                    </div>
                    <div className="col-span-2 flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = {
                            ...srsData,
                            [w.id]: computeNextSrsState(rec, 1),
                          };
                          setSrsData(updated);
                          storageService.saveVocabProgress(updated);
                        }}
                        className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] font-bold cursor-pointer"
                      >
                        Quên
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = {
                            ...srsData,
                            [w.id]: computeNextSrsState(rec, 4),
                          };
                          setSrsData(updated);
                          storageService.saveVocabProgress(updated);
                        }}
                        className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold cursor-pointer"
                      >
                        Đã thuộc
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}