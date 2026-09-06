(function(){
  'use strict';

  const DATA_FILES = [
    '../answer_keys_mock_kawai_2026_02_english_info.json',
    '../answer_keys_mock_kawai_2026_02_geo_history.json',
    '../answer_keys_mock_kawai_2026_02_civics_combined.json',
    '../answer_keys_mock_kawai_2026_02_japanese.json',
    '../answer_keys_mock_kawai_2026_02_math1.json',
    '../answer_keys_mock_kawai_2026_02_math2.json',
    '../answer_keys_mock_kawai_2026_02_science_basic.json',
    '../answer_keys_mock_kawai_2026_02_science_advanced.json'
  ];
  const KAWAI_GUIDE_URL = 'https://moshi-navi.kawai-juku.ac.jp/tebiki/2026/266062011';
  // Source link catalog, revision 2. Checked 2026-09-05/06. Missing kinds are unconfirmed.
  const SOURCE_LINK_CATALOG = {
    "2001||center-main||世界史A":{"問題":[["https://kyotsu.org/test/2001_%E4%B8%96%E7%95%8C%E5%8F%B2A_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]]},
    "2001||center-main||世界史B":{"問題":[["https://kyotsu.org/test/2001_%E4%B8%96%E7%95%8C%E5%8F%B2B_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]]},
    "2001||center-main||倫理":{"問題":[["https://kyotsu.org/test/2001_%E5%80%AB%E7%90%86_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]]},
    "2001||center-main||化学IA":{"問題":[["https://kyotsu.org/test/2001_%E5%8C%96%E5%AD%A6IA_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]]},
    "2001||center-main||化学IB":{"問題":[["https://kyotsu.org/test/2001_%E5%8C%96%E5%AD%A6IB_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]]},
    "2001||center-main||地学IA":{"問題":[["https://kyotsu.org/test/2001_%E5%9C%B0%E5%AD%A6IA_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]]},
    "2001||center-main||地学IB":{"問題":[["https://kyotsu.org/test/2001_%E5%9C%B0%E5%AD%A6IB_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]]},
    "2001||center-main||地理A":{"問題":[["https://kyotsu.org/test/2001_%E5%9C%B0%E7%90%86A_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://school.js88.com/scl_dai/center_data/question?subject_list_id=6&year=2001","解答"]]},
    "2001||center-main||地理B":{"問題":[["https://kyotsu.org/test/2001_%E5%9C%B0%E7%90%86B_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://school.js88.com/scl_dai/center_data/question?subject_list_id=7&year=2001","解答"]],"解説":[["https://ts9ts9ts.cloud-line.com/page21455/page34540/","解説"]]},
    "2001||center-main||政治・経済":{"問題":[["https://kyotsu.org/test/2001_%E6%94%BF%E6%B2%BB%E7%B5%8C%E6%B8%88_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://school.js88.com/scl_dai/center_data/question?subject_list_id=24&year=2001","解答"]]},
    "2001||center-main||数学I":{"問題":[["https://kyotsu.org/test/2001_%E6%95%B0%E5%AD%A6I_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://school.js88.com/scl_dai/center_data/question?subject_list_id=8&year=2001","解答"]],"解説":[["https://www.chart.co.jp/subject/sugaku/hen_tsushin/center/01center/centerk.html","解説"]]},
    "2001||center-main||数学II":{"問題":[["https://kyotsu.org/test/2001_%E6%95%B0%E5%AD%A6II_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解説":[["https://www.chart.co.jp/subject/sugaku/hen_tsushin/center/01center/centerk.html","解説"]]},
    "2001||center-main||数学II・B":{"問題":[["https://kyotsu.org/test/2001_%E6%95%B0%E5%AD%A6IIB_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://school.js88.com/scl_dai/center_data/question?subject_list_id=11&year=2001","解答"]],"解説":[["https://www.chart.co.jp/subject/sugaku/hen_tsushin/center/01center/centerk.html","解説（数研出版）"]]},
    "2001||center-main||数学I・A":{"問題":[["https://kyotsu.org/test/2001_%E6%95%B0%E5%AD%A6IA_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://school.js88.com/scl_dai/center_data/question?subject_list_id=9&year=2001","解答"]],"解説":[["https://www.chart.co.jp/subject/sugaku/hen_tsushin/center/01center/centerk.html","解説（数研出版）"]]},
    "2001||center-main||日本史A":{"問題":[["https://kyotsu.org/test/2001_%E6%97%A5%E6%9C%AC%E5%8F%B2A_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://school.js88.com/scl_dai/center_data/question?subject_list_id=4&year=2001","解答"]]},
    "2001||center-main||日本史B":{"問題":[["https://kyotsu.org/test/2001_%E6%97%A5%E6%9C%AC%E5%8F%B2B_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://school.js88.com/scl_dai/center_data/question?subject_list_id=5&year=2001","解答"]]},
    "2001||center-main||物理IA":{"問題":[["https://kyotsu.org/test/2001_%E7%89%A9%E7%90%86IA_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]]},
    "2001||center-main||物理IB":{"問題":[["https://kyotsu.org/test/2001_%E7%89%A9%E7%90%86IB_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]]},
    "2001||center-main||現代社会":{"問題":[["https://kyotsu.org/test/2001_%E7%8F%BE%E4%BB%A3%E7%A4%BE%E4%BC%9A_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://school.js88.com/scl_dai/center_data/question?subject_list_id=22&year=2001","解答"]]},
    "2001||center-main||生物IA":{"問題":[["https://kyotsu.org/test/2001_%E7%94%9F%E7%89%A9IA_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]]},
    "2001||center-main||生物IB":{"問題":[["https://kyotsu.org/test/2001_%E7%94%9F%E7%89%A9IB_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]]},
    "2001||center-main||英語（リーディング）":{"問題":[["https://kyotsu.org/test/2001_%E8%8B%B1%E8%AA%9ER_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://school.js88.com/scl_dai/center_data/question?subject_list_id=1&year=2001","解答"]]},
    "2002||center-main||世界史A":{"問題":[["https://kyotsu.org/test/2002_%E4%B8%96%E7%95%8C%E5%8F%B2A_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]]},
    "2002||center-main||世界史B":{"問題":[["https://kyotsu.org/test/2002_%E4%B8%96%E7%95%8C%E5%8F%B2B_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]]},
    "2002||center-main||倫理":{"問題":[["https://kyotsu.org/test/2002_%E5%80%AB%E7%90%86_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://school.js88.com/scl_dai/center_data/question?subject_list_id=76&year=2002","解答"]]},
    "2002||center-main||化学IA":{"問題":[["https://kyotsu.org/test/2002_%E5%8C%96%E5%AD%A6IA_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://school.js88.com/scl_dai/center_data/question?subject_list_id=71&year=2002","解答"]]},
    "2002||center-main||化学IB":{"問題":[["https://kyotsu.org/test/2002_%E5%8C%96%E5%AD%A6IB_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://school.js88.com/scl_dai/center_data/question?subject_list_id=72&year=2002","解答"]]},
    "2002||center-main||地学IB":{"問題":[["https://kyotsu.org/test/2002_%E5%9C%B0%E5%AD%A6IB_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://school.js88.com/scl_dai/center_data/question?subject_list_id=74&year=2002","解答"]]},
    "2002||center-main||地理A":{"問題":[["https://kyotsu.org/test/2002_%E5%9C%B0%E7%90%86A_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]]},
    "2002||center-main||地理B":{"問題":[["https://kyotsu.org/test/2002_%E5%9C%B0%E7%90%86B_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://school.js88.com/scl_dai/center_data/question?subject_list_id=59&year=2002","解答"]]},
    "2002||center-main||政治・経済":{"問題":[["https://kyotsu.org/test/2002_%E6%94%BF%E6%B2%BB%E7%B5%8C%E6%B8%88_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://school.js88.com/scl_dai/center_data/question?subject_list_id=77&year=2002","解答"]]},
    "2002||center-main||数学I・A":{"問題":[["https://kyotsu.org/test/2002_%E6%95%B0%E5%AD%A6IA_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://school.js88.com/scl_dai/center_data/question?subject_list_id=61&year=2002","解答"]]},
    "2002||center-main||日本史A":{"問題":[["https://kyotsu.org/test/2002_%E6%97%A5%E6%9C%AC%E5%8F%B2A_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]]},
    "2002||center-main||日本史B":{"問題":[["https://kyotsu.org/test/2002_%E6%97%A5%E6%9C%AC%E5%8F%B2B_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://school.js88.com/scl_dai/center_data/question?subject_list_id=57&year=2002","解答"]]},
    "2002||center-main||物理IB":{"解答":[["https://school.js88.com/scl_dai/center_data/question?subject_list_id=68&year=2002","解答"]]},
    "2002||center-main||現代社会":{},
    "2002||center-main||生物IA":{"解答":[["https://school.js88.com/scl_dai/center_data/question?subject_list_id=69&year=2002","解答"]]},
    "2002||center-main||生物IB":{"解答":[["https://school.js88.com/scl_dai/center_data/question?subject_list_id=70&year=2002","解答"]]},
    "2002||center-main||総合理科":{},
    "2002||center-main||英語（リーディング）":{"解答":[["https://school.js88.com/scl_dai/center_data/question?subject_list_id=53&year=2002","解答"]]},
    "2003||center-main||化学IA":{},
    "2003||center-main||化学IB":{},
    "2003||center-main||国語":{},
    "2003||center-main||地学IB":{},
    "2003||center-main||数学II・B":{},
    "2003||center-main||数学I・A":{"解説":[["https://www.chart.co.jp/subject/sugaku/hen_tsushin/center/03center/03centerk.html","解説"]]},
    "2003||center-main||物理IA":{},
    "2003||center-main||物理IB":{},
    "2003||center-main||生物IB":{},
    "2003||center-main||英語（リーディング）":{},
    "2004||center-main||世界史A":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2004WhisA_Ans.pdf","解答"]]},
    "2004||center-main||世界史B":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2004WhisB_Ans.pdf","解答"]]},
    "2004||center-main||倫理":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2004Eth_Ans.pdf","解答"]]},
    "2004||center-main||化学IA":{},
    "2004||center-main||化学IB":{},
    "2004||center-main||地学IA":{},
    "2004||center-main||地学IB":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2004GeolB_Ans.pdf","解答"]]},
    "2004||center-main||地理A":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2004GeogA_Ans.pdf","解答"]]},
    "2004||center-main||地理B":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2004GeogB_Ans.pdf","解答"]]},
    "2004||center-main||政治・経済":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2004Gov_Ans.pdf","解答"]]},
    "2004||center-main||数学I":{"問題":[["https://kyotsu.org/test/2004_%E6%95%B0%E5%AD%A6I_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2004Math1_Ans.pdf","解答"]]},
    "2004||center-main||数学II":{"問題":[["https://kyotsu.org/test/2004_%E6%95%B0%E5%AD%A6II_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2004Math2_Ans.pdf","解答"]]},
    "2004||center-main||数学II・B":{"問題":[["https://kyotsu.org/test/2004_%E6%95%B0%E5%AD%A6IIB_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]]},
    "2004||center-main||数学I・A":{"問題":[["https://kyotsu.org/test/2004_%E6%95%B0%E5%AD%A6IA_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]]},
    "2004||center-main||日本史A":{"問題":[["https://kyotsu.org/test/2004_%E6%97%A5%E6%9C%AC%E5%8F%B2A_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2004JhisA_Ans.pdf","解答"]]},
    "2004||center-main||日本史B":{"問題":[["https://kyotsu.org/test/2004_%E6%97%A5%E6%9C%AC%E5%8F%B2B_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2004JhisB_Ans.pdf","解答"]]},
    "2004||center-main||物理IA":{"問題":[["https://kyotsu.org/test/2004_%E7%89%A9%E7%90%86IA_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]]},
    "2004||center-main||物理IB":{"問題":[["https://kyotsu.org/test/2004_%E7%89%A9%E7%90%86IB_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]]},
    "2004||center-main||現代社会":{"問題":[["https://kyotsu.org/test/2004_%E7%8F%BE%E4%BB%A3%E7%A4%BE%E4%BC%9A_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2004Soc_Ans.pdf","解答"]]},
    "2004||center-main||生物IA":{"問題":[["https://kyotsu.org/test/2004_%E7%94%9F%E7%89%A9IA_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]]},
    "2004||center-main||生物IB":{"問題":[["https://kyotsu.org/test/2004_%E7%94%9F%E7%89%A9IB_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]]},
    "2004||center-main||総合理科":{"問題":[["https://kyotsu.org/test/2004_%E7%B7%8F%E5%90%88%E7%90%86%E7%A7%91_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]]},
    "2004||center-main||英語（リーディング）":{"問題":[["https://kyotsu.org/test/2004_%E8%8B%B1%E8%AA%9ER_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]]},
    "2005||center-main||世界史A":{"問題":[["https://kyotsu.org/test/2005_%E4%B8%96%E7%95%8C%E5%8F%B2A_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2005WhisA_Ans.pdf","解答"]]},
    "2005||center-main||世界史B":{"問題":[["https://kyotsu.org/test/2005_%E4%B8%96%E7%95%8C%E5%8F%B2B_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2005WhisB_Ans.pdf","解答"]]},
    "2005||center-main||倫理":{},
    "2005||center-main||化学IA":{"問題":[["https://kyotsu.org/test/2005_%E5%8C%96%E5%AD%A6IA_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]]},
    "2005||center-main||化学IB":{"問題":[["https://kyotsu.org/test/2005_%E5%8C%96%E5%AD%A6IB_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]]},
    "2005||center-main||地学IA":{},
    "2005||center-main||地学IB":{},
    "2005||center-main||地理A":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2005GeogA_Ans.pdf","解答"]]},
    "2005||center-main||地理B":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2005GeogB_Ans.pdf","解答"]]},
    "2005||center-main||政治・経済":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2005Gov_Ans.pdf","解答"]]},
    "2005||center-main||数学I":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2005Math1_Ans.pdf","解答"]]},
    "2005||center-main||数学II":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2005Math2_Ans.pdf","解答"]]},
    "2005||center-main||数学II・B":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2005Math2B_Ans.pdf","解答"]]},
    "2005||center-main||数学I・A":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2005Math1A_Ans.pdf","解答"]]},
    "2005||center-main||日本史A":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2005JhisA_Ans.pdf","解答"]]},
    "2005||center-main||日本史B":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2005JhisB_Ans.pdf","解答"]]},
    "2005||center-main||物理IA":{},
    "2005||center-main||現代社会":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2005Soc_Ans.pdf","解答"]]},
    "2005||center-main||生物IA":{},
    "2005||center-main||生物IB":{"問題":[["https://kyotsu.org/test/2005_%E7%94%9F%E7%89%A9IB_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]]},
    "2005||center-main||総合理科":{},
    "2005||center-main||英語（リーディング）":{},
    "2006||center-main||世界史A":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2006WhisA_Ans.pdf","解答"]]},
    "2006||center-main||世界史B":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2006WhisB_Ans.pdf","解答"]]},
    "2006||center-main||倫理":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2006Eth_Ans.pdf","解答"]]},
    "2006||center-main||化学I":{},
    "2006||center-main||化学IA":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2006Chem1A_Ans.pdf","解答"]]},
    "2006||center-main||地学I":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2006Geol1_Ans.pdf","解答"]]},
    "2006||center-main||地学IA":{},
    "2006||center-main||地理A":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2006GeogA_Ans.pdf","解答"]]},
    "2006||center-main||地理B":{"問題":[["https://kyotsu.org/test/2006_%E5%9C%B0%E7%90%86B_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2006GeogB_Ans.pdf","解答"]]},
    "2006||center-main||政治・経済":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2006Gov_Ans.pdf","解答"]]},
    "2006||center-main||数学I":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2006Math1_Ans.pdf","解答"]]},
    "2006||center-main||数学II":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2006Math2_Ans.pdf","解答"]]},
    "2006||center-main||数学II・B":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2006Math2B_Ans.pdf","解答"]],"解説":[["https://www.chart.co.jp/subject/sugaku/hen_tsushin/center/06center/06center_qa.html","解説（数研出版）"]]},
    "2006||center-main||数学I・A":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2006Math1A_Ans.pdf","解答"]],"解説":[["https://www.chart.co.jp/subject/sugaku/hen_tsushin/center/06center/06center_qa.html","解説（数研出版）"]]},
    "2006||center-main||日本史A":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2006JhisA_Ans.pdf","解答"]]},
    "2006||center-main||日本史B":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2006JhisB_Ans.pdf","解答"]]},
    "2006||center-main||物理I":{},
    "2006||center-main||物理IA":{},
    "2006||center-main||現代社会":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2006Soc_Ans.pdf","解答"]]},
    "2006||center-main||理科総合A":{},
    "2006||center-main||理科総合B":{},
    "2006||center-main||生物I":{},
    "2006||center-main||生物IA":{},
    "2006||center-main||総合理科":{},
    "2006||center-main||英語（リスニング）":{"解答":[["https://listening.tokyo/?portfolio-cat=2006h","解答"]],"解説":[["https://listening.tokyo/?portfolio-cat=2006h","解説"]]},
    "2006||center-main||英語（リーディング）":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2006Eng_Ans.pdf","解答"]]},
    "2006||retake||英語（リスニング）":{"掲載ページ":[["https://listening.tokyo/?portfolio-cat=2006t","掲載ページ"]]},
    "2007||center-main||世界史A":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2007WhisA_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2007/","解説"]]},
    "2007||center-main||世界史B":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2007WhisB_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2007/","解説"]]},
    "2007||center-main||倫理":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2007Eth_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2007/pdf/kaisetsu/rinri_k.pdf","解説"]]},
    "2007||center-main||化学I":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2007Chem1_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2007/pdf/kaisetsu/kagaku_k.pdf","解説"]]},
    "2007||center-main||地学I":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2007Geol1_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2007/","解説"]]},
    "2007||center-main||地理A":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2007GeogA_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2007/","解説"]]},
    "2007||center-main||地理B":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2007GeogB_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2007/","解説"]]},
    "2007||center-main||政治・経済":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2007Gov_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2007/","解説"]]},
    "2007||center-main||数学I":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2007Math1_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2007/","解説"]]},
    "2007||center-main||数学II":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2007Math2_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2007/","解説"]]},
    "2007||center-main||数学II・B":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2007Math2B_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2007/","解説"]]},
    "2007||center-main||数学I・A":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2007Math1A_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2007/","解説"]]},
    "2007||center-main||日本史A":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2007JhisA_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2007/","解説"]]},
    "2007||center-main||日本史B":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2007JhisB_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2007/","解説"]]},
    "2007||center-main||物理I":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2007Phy1_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2007/","解説"]]},
    "2007||center-main||現代社会":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2007Soc_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2007/","解説"]]},
    "2007||center-main||理科総合A":{"解説":[["https://www.toshin.com/center/2007/","解説"]]},
    "2007||center-main||理科総合B":{"解説":[["https://www.toshin.com/center/2007/","解説"]]},
    "2007||center-main||生物I":{"解説":[["https://www.toshin.com/center/2007/","解説"]]},
    "2007||center-main||英語（リスニング）":{"解答":[["https://listening.tokyo/?portfolio-cat=2007h","解答"]],"解説":[["https://listening.tokyo/?portfolio-cat=2007h","解説"]]},
    "2007||center-main||英語（リーディング）":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2007Eng_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2007/pdf/kaisetsu/eigo_k.pdf","解説"]]},
    "2007||retake||英語（リスニング）":{"掲載ページ":[["https://listening.tokyo/?portfolio-cat=2007t","掲載ページ"]]},
    "2008||center-main||世界史A":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2008WhisA_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2008/","解説"]]},
    "2008||center-main||世界史B":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2008WhisB_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2008/","解説"]]},
    "2008||center-main||倫理":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2008Eth_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2008/","解説"]]},
    "2008||center-main||化学I":{"解答":[["https://www.toshin.com/center/2008/pdf/a/kagaku_ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2008/","解説"]]},
    "2008||center-main||国語":{"解説":[["https://www.toshin.com/center/2008/","解説"]]},
    "2008||center-main||地学I":{"解説":[["https://www.toshin.com/center/2008/","解説"]]},
    "2008||center-main||地理A":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2008GeogA_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2008/","解説"]]},
    "2008||center-main||地理B":{"問題":[["https://www.toshin.com/center/2008/pdf/q/chiri-b.pdf","問題"]],"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2008GeogB_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2008/","解説"]]},
    "2008||center-main||政治・経済":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2008Gov_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2008/","解説"]]},
    "2008||center-main||数学I":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2008Math1_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2008/","解説"]]},
    "2008||center-main||数学II":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2008Math2_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2008/","解説"]]},
    "2008||center-main||数学II・B":{"問題":[["https://www.toshin.com/center/2008/sugaku-2b_mondai_0.html","問題"]],"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2008Math2B_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2008/","解説"]]},
    "2008||center-main||数学I・A":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2008Math1A_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2008/","解説"]]},
    "2008||center-main||日本史A":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2008JhisA_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2008/","解説"]]},
    "2008||center-main||日本史B":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2008JhisB_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2008/","解説"]]},
    "2008||center-main||物理I":{"解説":[["https://www.toshin.com/center/2008/","解説"]]},
    "2008||center-main||現代社会":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2008Soc_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2008/","解説"]]},
    "2008||center-main||理科総合A":{"解説":[["https://www.toshin.com/center/2008/","解説"]]},
    "2008||center-main||理科総合B":{"解説":[["https://www.toshin.com/center/2008/","解説"]]},
    "2008||center-main||生物I":{"解説":[["https://www.toshin.com/center/2008/","解説"]]},
    "2008||center-main||英語（リスニング）":{"問題":[["https://www.toshin.com/center/2008/pdf/q/listning.pdf","問題"]],"解説":[["https://www.toshin.com/center/2008/","解説"]]},
    "2008||center-main||英語（リーディング）":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2008Eng_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2008/","解説"]]},
    "2008||retake||英語（リスニング）":{"掲載ページ":[["https://listening.tokyo/?portfolio-cat=2008t","掲載ページ"]]},
    "2009||center-main||世界史A":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2009WhisA_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2009/","解説"]]},
    "2009||center-main||世界史B":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2009WhisB_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2009/","解説"]]},
    "2009||center-main||倫理":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2009Eth_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2009/","解説"]]},
    "2009||center-main||化学I":{"解説":[["https://www.toshin.com/center/2009/","解説"]]},
    "2009||center-main||国語":{"解説":[["https://www.toshin.com/center/2009/","解説"]]},
    "2009||center-main||地学I":{"解説":[["https://www.toshin.com/center/2009/","解説"]]},
    "2009||center-main||地理A":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2009GeogA_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2009/","解説"]]},
    "2009||center-main||地理B":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2009GeogB_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2009/","解説"]]},
    "2009||center-main||政治・経済":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2009Gov_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2009/","解説"]]},
    "2009||center-main||数学I":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2009Math1_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2009/","解説"]]},
    "2009||center-main||数学II":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2009Math2_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2009/","解説"]]},
    "2009||center-main||数学II・B":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2009Math2B_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2009/","解説"]]},
    "2009||center-main||数学I・Ａ":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2009Math1A_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2009/","解説"]]},
    "2009||center-main||日本史A":{"問題":[["https://kyotsu.org/test/2009_%E6%97%A5%E6%9C%AC%E5%8F%B2A_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2009JhisA_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2009/","解説"]]},
    "2009||center-main||日本史B":{"問題":[["https://kyotsu.org/test/2009_%E6%97%A5%E6%9C%AC%E5%8F%B2B_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2009JhisB_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2009/","解説"]]},
    "2009||center-main||物理I":{"問題":[["https://kyotsu.org/test/2009_%E7%89%A9%E7%90%86I_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2009Phy1_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2009/","解説"]]},
    "2009||center-main||現代社会":{"問題":[["https://kyotsu.org/test/2009_%E7%8F%BE%E4%BB%A3%E7%A4%BE%E4%BC%9A_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2009Soc_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2009/","解説"]]},
    "2009||center-main||理科総合A":{"問題":[["https://kyotsu.org/test/2009_%E7%90%86%E7%A7%91%E7%B7%8F%E5%90%88A_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解説":[["https://www.toshin.com/center/2009/","解説"]]},
    "2009||center-main||理科総合B":{"問題":[["https://kyotsu.org/test/2009_%E7%90%86%E7%A7%91%E7%B7%8F%E5%90%88B_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解説":[["https://www.toshin.com/center/2009/","解説"]]},
    "2009||center-main||生物I":{"解説":[["https://www.toshin.com/center/2009/","解説"]]},
    "2009||center-main||英語（リスニング）":{"解説":[["https://www.toshin.com/center/2009/","解説"]]},
    "2009||center-main||英語（リーディング）":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2009Eng_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2009/","解説"]]},
    "2009||retake||英語（リスニング）":{"問題":[["https://kyotsu.org/test/2009_%E8%8B%B1%E8%AA%9EL_%E8%BF%BD%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"掲載ページ":[["https://listening.tokyo/?portfolio-cat=2009t","掲載ページ"]]},
    "2010||center-main||世界史A":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2010WhisA_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2010/","解説"]]},
    "2010||center-main||世界史B":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2010WhisB_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2010/","解説"]]},
    "2010||center-main||倫理":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2010Eth_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2010/","解説"]]},
    "2010||center-main||化学I":{"解説":[["https://www.toshin.com/center/2010/","解説"]]},
    "2010||center-main||国語":{"問題":[["https://kyotsu.org/test/2010_%E5%9B%BD%E8%AA%9E_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.toshin.com/center/2010/kokugo_ans.html","解答"]],"解説":[["https://www.toshin.com/center/2010/","解説"]]},
    "2010||center-main||地学I":{"解説":[["https://www.toshin.com/center/2010/","解説"]]},
    "2010||center-main||地理A":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2010GeogA_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2010/","解説"]]},
    "2010||center-main||地理B":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2010GeogB_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2010/","解説"]]},
    "2010||center-main||政治・経済":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2010Gov_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2010/","解説"]]},
    "2010||center-main||数学I":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2010Math1_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2010/","解説"]]},
    "2010||center-main||数学II":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2010Math2_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2010/","解説"]]},
    "2010||center-main||数学II・B":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2010Math2B_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2010/","解説"]]},
    "2010||center-main||数学I・Ａ":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2010Math1A_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2010/","解説"]]},
    "2010||center-main||日本史A":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2010JhisA_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2010/","解説"]]},
    "2010||center-main||日本史B":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2010JhisB_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2010/","解説"]]},
    "2010||center-main||物理I":{"解説":[["https://www.toshin.com/center/2010/","解説"]]},
    "2010||center-main||現代社会":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2010Soc_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2010/","解説"]]},
    "2010||center-main||理科総合A":{"解説":[["https://www.toshin.com/center/2010/","解説"]]},
    "2010||center-main||理科総合B":{"解説":[["https://www.toshin.com/center/2010/","解説"]]},
    "2010||center-main||生物I":{"解説":[["https://www.toshin.com/center/2010/","解説"]]},
    "2010||center-main||英語（リスニング）":{"解説":[["https://www.toshin.com/center/2010/","解説"]]},
    "2010||center-main||英語（リーディング）":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2010Eng_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2010/","解説"]]},
    "2010||retake||英語（リスニング）":{"掲載ページ":[["https://listening.tokyo/?portfolio-cat=2010t","掲載ページ"]]},
    "2011||center-main||世界史A":{"解説":[["https://www.toshin.com/center/2011/","解説"]]},
    "2011||center-main||世界史B":{"解説":[["https://www.toshin.com/center/2011/","解説"]]},
    "2011||center-main||倫理":{"解説":[["https://www.toshin.com/center/2011/","解説"]]},
    "2011||center-main||化学I":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2011kagaku1_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2011/","解説"]]},
    "2011||center-main||国語":{"解説":[["https://www.toshin.com/center/2011/","解説"]]},
    "2011||center-main||地学I":{"解説":[["https://www.toshin.com/center/2011/","解説"]]},
    "2011||center-main||地理A":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2011chiriA_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2011/","解説"]]},
    "2011||center-main||地理B":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2011chiriB_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2011/","解説"]]},
    "2011||center-main||政治・経済":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2011seikei_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2011/","解説"]]},
    "2011||center-main||数学I":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2011sugaku1_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2011/","解説"]]},
    "2011||center-main||数学II":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2011sugaku2_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2011/","解説"]]},
    "2011||center-main||数学II・B":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2011sugaku2B_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2011/","解説"]]},
    "2011||center-main||数学I・Ａ":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2011sugaku1A_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2011/","解説"]]},
    "2011||center-main||日本史A":{"解説":[["https://www.toshin.com/center/2011/","解説"]]},
    "2011||center-main||日本史B":{"解説":[["https://www.toshin.com/center/2011/","解説"]]},
    "2011||center-main||物理I":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2011buturi1_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2011/","解説"]]},
    "2011||center-main||現代社会":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2011gensya_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2011/","解説"]]},
    "2011||center-main||理科総合A":{"解説":[["https://www.toshin.com/center/2011/","解説"]]},
    "2011||center-main||理科総合B":{"解説":[["https://www.toshin.com/center/2011/","解説"]]},
    "2011||center-main||生物I":{"解説":[["https://www.toshin.com/center/2011/","解説"]]},
    "2011||center-main||英語（リスニング）":{"解説":[["https://www.toshin.com/center/2011/","解説"]]},
    "2011||center-main||英語（リーディング）":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2011eigo_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2011/","解説"]]},
    "2011||retake||英語（リスニング）":{"掲載ページ":[["https://listening.tokyo/?portfolio-cat=2011t","掲載ページ"]]},
    "2012||center-main||世界史A":{"問題":[["https://kyotsu.org/test/2012_%E4%B8%96%E7%95%8C%E5%8F%B2A_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.toshin.com/center/2012/a/sekaishi-a_ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2012/","解説"]]},
    "2012||center-main||世界史B":{"解答":[["https://www.toshin.com/center/2012/a/sekaishi-b_ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2012/","解説"]]},
    "2012||center-main||倫理":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2012rinri_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2012/","解説"]]},
    "2012||center-main||倫理，政治・経済":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2012rinri_seikei_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2012/","解説"]]},
    "2012||center-main||化学I":{"問題":[["https://www.toshin.com/center/2012/kagaku_mondai_0.html","問題"]],"解説":[["https://www.toshin.com/center/2012/","解説"]]},
    "2012||center-main||国語":{"問題":[["https://www.toshin.com/center/2012/kokugo_mondai_0.html","問題"]],"解答":[["https://www.toshin.com/center/2012/kokugo_ans.html","解答"]],"解説":[["https://www.toshin.com/center/2012/","解説"]]},
    "2012||center-main||地学I":{"解説":[["https://www.toshin.com/center/2012/","解説"]]},
    "2012||center-main||地理A":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2012chiriA_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2012/","解説"]]},
    "2012||center-main||地理B":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2012chiriB_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2012/","解説"]]},
    "2012||center-main||政治・経済":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2012seikei_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2012/","解説"]]},
    "2012||center-main||数学I":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2012sugaku1_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2012/","解説"]]},
    "2012||center-main||数学II":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2012sugaku2_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2012/","解説"]]},
    "2012||center-main||数学II・B":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2012sugaku2B_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2012/","解説"]]},
    "2012||center-main||数学I・Ａ":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2012sugaku1A_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2012/","解説"]]},
    "2012||center-main||日本史A":{"解答":[["https://www.toshin.com/center/2012/nihonshi-a_ans.html","解答"]],"解説":[["https://www.toshin.com/center/2012/","解説"]]},
    "2012||center-main||日本史B":{"問題":[["https://kyotsu.org/test/2012_%E6%97%A5%E6%9C%AC%E5%8F%B2B_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解説":[["https://www.toshin.com/center/2012/","解説"]]},
    "2012||center-main||物理I":{"解説":[["https://www.toshin.com/center/2012/","解説"]]},
    "2012||center-main||現代社会":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2012gensya_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2012/","解説"]]},
    "2012||center-main||理科総合A":{"解説":[["https://www.toshin.com/center/2012/","解説"]]},
    "2012||center-main||理科総合B":{"解説":[["https://www.toshin.com/center/2012/","解説"]]},
    "2012||center-main||生物I":{"問題":[["https://www.toshin.com/center/2012/seibutsu_mondai_0.html","問題"]],"解説":[["https://www.toshin.com/center/2012/","解説"]]},
    "2012||center-main||英語（リスニング）":{"解説":[["https://www.toshin.com/center/2012/","解説"]]},
    "2012||center-main||英語（リーディング）":{"問題":[["https://www.toshin.com/center/2012/eigo_mondai_0.html","問題"]],"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2012eigo_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2012/","解説"]]},
    "2012||retake||英語（リスニング）":{"掲載ページ":[["https://listening.tokyo/?portfolio-cat=2012t","掲載ページ"]]},
    "2012||retake||英語（リーディング）":{},
    "2013||center-main||世界史A":{"解説":[["https://www.toshin.com/center/2013/","解説"]]},
    "2013||center-main||世界史B":{"解説":[["https://www.toshin.com/center/2013/","解説"]]},
    "2013||center-main||倫理":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2013rinri_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2013/","解説"]]},
    "2013||center-main||倫理，政治・経済":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2013rinri_seikei_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2013/","解説"]]},
    "2013||center-main||化学I":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2013kagaku1_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2013/","解説"]]},
    "2013||center-main||国語":{"解答":[["https://edu.chunichi.co.jp/site_home/center/pdf/2013kokugo_a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2013/","解説"]]},
    "2013||center-main||地学I":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2013chigaku1_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2013/","解説"]]},
    "2013||center-main||地理A":{"問題":[["https://kyotsu.org/test/2013_%E5%9C%B0%E7%90%86A_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2013chiriA_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2013/","解説"]]},
    "2013||center-main||地理B":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2013chiriB_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2013/","解説"]]},
    "2013||center-main||政治・経済":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2013seikei_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2013/","解説"]]},
    "2013||center-main||数学I":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2013sugaku1_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2013/","解説"]]},
    "2013||center-main||数学II":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2013sugaku2_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2013/","解説"]]},
    "2013||center-main||数学II・B":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2013sugaku2B_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2013/","解説"]]},
    "2013||center-main||数学I・Ａ":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2013sugaku1A_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2013/","解説"]]},
    "2013||center-main||日本史A":{"解説":[["https://www.toshin.com/center/2013/","解説"]]},
    "2013||center-main||日本史B":{"解説":[["https://www.toshin.com/center/2013/","解説"]]},
    "2013||center-main||物理I":{"解説":[["https://www.toshin.com/center/2013/","解説"]]},
    "2013||center-main||現代社会":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2013gensya_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2013/","解説"]]},
    "2013||center-main||理科総合A":{"解説":[["https://www.toshin.com/center/2013/","解説"]]},
    "2013||center-main||理科総合B":{"解説":[["https://www.toshin.com/center/2013/","解説"]]},
    "2013||center-main||生物I":{"解説":[["https://www.toshin.com/center/2013/","解説"]]},
    "2013||center-main||英語（リスニング）":{"解答":[["https://edu.chunichi.co.jp/site_home/center/pdf/2013English-L_a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2013/","解説"]]},
    "2013||center-main||英語（リーディング）":{"解答":[["https://edu.chunichi.co.jp/site_home/center/pdf/2013English_a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2013/","解説"]]},
    "2013||retake||英語（リスニング）":{"掲載ページ":[["https://listening.tokyo/?portfolio-cat=2013t","掲載ページ"]]},
    "2013||retake||英語（リーディング）":{},
    "2014||center-main||世界史A":{"解答":[["https://edu.chunichi.co.jp/site_home/center/pdf/2014sekaishi-A_a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2014/","解説"]]},
    "2014||center-main||世界史B":{"解答":[["https://edu.chunichi.co.jp/site_home/center/pdf/2014sekaishi-B_a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2014/","解説"]]},
    "2014||center-main||倫理":{"解答":[["https://edu.chunichi.co.jp/site_home/center/pdf/2014rinri_a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2014/","解説"]]},
    "2014||center-main||倫理，政治・経済":{"解答":[["https://edu.chunichi.co.jp/site_home/center/pdf/2014rinri-seikei_a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2014/","解説"]]},
    "2014||center-main||化学I":{"解答":[["https://edu.chunichi.co.jp/site_home/center/pdf/2014kagaku-1_a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2014/","解説"]]},
    "2014||center-main||国語":{"問題":[["https://www.toshin.com/center/2014/q/kokugo.pdf","問題"]],"解答":[["https://edu.chunichi.co.jp/site_home/center/pdf/2014kokugo_a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2014/","解説"]]},
    "2014||center-main||地学I":{"問題":[["https://www.toshin.com/center/2014/chigaku_mondai_0.html","問題"]],"解答":[["https://edu.chunichi.co.jp/site_home/center/pdf/2014chigaku-1_a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2014/","解説"]]},
    "2014||center-main||地理A":{"問題":[["https://kyotsu.org/test/2014_%E5%9C%B0%E7%90%86A_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://edu.chunichi.co.jp/site_home/center/pdf/2014chiri-A_a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2014/","解説"]]},
    "2014||center-main||地理B":{"問題":[["https://www.toshin.com/center/2014/chiri-b_mondai_0.html","問題"]],"解答":[["https://edu.chunichi.co.jp/site_home/center/pdf/2014chiri-B_a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2014/","解説"]]},
    "2014||center-main||政治・経済":{"解答":[["https://edu.chunichi.co.jp/site_home/center/pdf/2014seikei_a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2014/","解説"]]},
    "2014||center-main||数学I":{"解答":[["https://edu.chunichi.co.jp/site_home/center/pdf/2014sugaku-1_a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2014/","解説"]]},
    "2014||center-main||数学II":{"解答":[["https://edu.chunichi.co.jp/site_home/center/pdf/2014sugaku-2_a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2014/","解説"]]},
    "2014||center-main||数学II・B":{"問題":[["https://www.toshin.com/center/2014/sugaku-2b_mondai_0.html","問題"]],"解答":[["https://edu.chunichi.co.jp/site_home/center/pdf/2014sugaku-2B_a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2014/","解説"]]},
    "2014||center-main||数学I・Ａ":{"問題":[["https://www.toshin.com/center/2014/sugaku-1a_mondai_0.html","問題"]],"解答":[["https://edu.chunichi.co.jp/site_home/center/pdf/2014sugaku-1A_a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2014/","解説"]]},
    "2014||center-main||日本史A":{"解答":[["https://edu.chunichi.co.jp/site_home/center/pdf/2014nihonshi-A_a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2014/","解説"]]},
    "2014||center-main||日本史B":{"解答":[["https://edu.chunichi.co.jp/site_home/center/pdf/2014nihonshi-B_a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2014/","解説"]]},
    "2014||center-main||物理I":{"問題":[["https://www.toshin.com/center/2014/butsuri_mondai_0.html","問題"]],"解答":[["https://edu.chunichi.co.jp/site_home/center/pdf/2014butsuri-1_a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2014/","解説"]]},
    "2014||center-main||現代社会":{"解答":[["https://edu.chunichi.co.jp/site_home/center/pdf/2014gensha_a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2014/","解説"]]},
    "2014||center-main||理科総合A":{"解答":[["https://edu.chunichi.co.jp/site_home/center/pdf/2014rika-A_a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2014/","解説"]]},
    "2014||center-main||理科総合B":{"解答":[["https://www.toshin.com/center/2014/rikasougou-b_ans.html","解答"]],"解説":[["https://www.toshin.com/center/2014/","解説"]]},
    "2014||center-main||生物I":{"解答":[["https://edu.chunichi.co.jp/site_home/center/pdf/2014seibutsu-1_a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2014/","解説"]]},
    "2014||center-main||英語（リスニング）":{"問題":[["https://www.toshin.com/center/2014/listning_mondai_0.html","問題"]],"解答":[["https://edu.chunichi.co.jp/pages/center2014","解答"]],"解説":[["https://www.toshin.com/center/2014/","解説"]]},
    "2014||center-main||英語（リーディング）":{"問題":[["https://www.toshin.com/center/2014/eigo_mondai_0.html","問題"]],"解答":[["https://edu.chunichi.co.jp/pages/center2014","解答"]],"解説":[["https://www.toshin.com/center/2014/","解説"]]},
    "2014||retake||英語（リスニング）":{"掲載ページ":[["https://www.mmsankosho.com/centerlistening2014tuisi/","掲載ページ"]]},
    "2014||retake||英語（リーディング）":{},
    "2015||center-main||世界史A":{"問題":[["https://www.toshin.com/center/2015/sekaishi-a_mondai_0.html","問題"]],"解説":[["https://www.toshin.com/center/2015/","解説"]]},
    "2015||center-main||世界史B":{"解説":[["https://www.toshin.com/center/2015/","解説"]]},
    "2015||center-main||倫理":{"問題":[["https://www.toshin.com/center/2015/rinri_mondai_0.html","問題"]],"解説":[["https://www.toshin.com/center/2015/","解説"]]},
    "2015||center-main||倫理，政治・経済":{"解説":[["https://www.toshin.com/center/2015/","解説"]]},
    "2015||center-main||化学":{"問題":[["https://kyotsu.org/test/2015_%E5%8C%96%E5%AD%A6_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解説":[["https://www.toshin.com/center/2015/","解説"]]},
    "2015||center-main||化学基礎":{"問題":[["https://www.toshin.com/center/2015/q/kagaku-kiso.pdf","問題"]],"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=378&year=2015","解答"]],"解説":[["https://www.toshin.com/center/2015/","解説"]]},
    "2015||center-main||国語":{"問題":[["https://kyotsu.org/test/2015_%E5%9B%BD%E8%AA%9E_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://edu.chunichi.co.jp/site_home/center/pdf/2015kokugo_a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2015/","解説"]]},
    "2015||center-main||地学":{"解説":[["https://www.toshin.com/center/2015/","解説"]]},
    "2015||center-main||地学基礎":{"解答":[["https://www.toshin.com/center/2015/a/chigaku-kiso_ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2015/","解説"]]},
    "2015||center-main||地理A":{"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=369&year=2015","解答"]],"解説":[["https://www.toshin.com/center/2015/","解説"]]},
    "2015||center-main||地理B":{"解説":[["https://www.toshin.com/center/2015/","解説"]]},
    "2015||center-main||政治・経済":{"問題":[["https://www.toshin.com/center/2015/q/s-keizai.pdf","問題"]],"解説":[["https://www.toshin.com/center/2015/","解説"]]},
    "2015||center-main||数学I":{"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=381&year=2015","解答"]],"解説":[["https://www.toshin.com/center/2015/","解説"]]},
    "2015||center-main||数学II":{"解説":[["https://www.toshin.com/center/2015/","解説"]]},
    "2015||center-main||数学II・B":{"問題":[["https://kyotsu.org/test/2015_%E6%95%B0%E5%AD%A6IIB_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=386&year=2015","解答"]],"解説":[["https://www.toshin.com/center/2015/","解説"]]},
    "2015||center-main||数学I・Ａ":{"解答":[["https://www.toshin.com/center/2015/sugaku-1a_ans.html","解答"]],"解説":[["https://www.toshin.com/center/2015/","解説"]]},
    "2015||center-main||日本史A":{"解説":[["https://www.toshin.com/center/2015/","解説"]]},
    "2015||center-main||日本史B":{"問題":[["https://www.toshin.com/center/2015/nihonshi-b_mondai_0.html","問題"]],"解説":[["https://www.toshin.com/center/2015/","解説"]]},
    "2015||center-main||物理":{"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=388&year=2015","解答"]],"解説":[["https://www.toshin.com/center/2015/","解説"]]},
    "2015||center-main||物理基礎":{"問題":[["https://kyotsu.org/test/2015_%E7%89%A9%E7%90%86%E5%9F%BA%E7%A4%8E_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=377&year=2015","解答"]],"解説":[["https://www.toshin.com/center/2015/","解説"]]},
    "2015||center-main||現代社会":{"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=371&year=2015","解答"]],"解説":[["https://www.toshin.com/center/2015/","解説"]]},
    "2015||center-main||生物":{"解説":[["https://www.toshin.com/center/2015/","解説"]]},
    "2015||center-main||生物基礎":{"解答":[["https://www.toshin.com/center/2015/seibutsu-kiso_ans.html","解答"]],"解説":[["https://www.toshin.com/center/2015/","解説"]]},
    "2015||center-main||英語（リスニング）":{"問題":[["https://kyotsu.org/test/2015_%E8%8B%B1%E8%AA%9EL_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://edu.chunichi.co.jp/pages/center2015","解答"]],"解説":[["https://www.toshin.com/center/2015/","解説"]]},
    "2015||center-main||英語（リーディング）":{"解説":[["https://www.toshin.com/center/2015/","解説"]]},
    "2015||retake||英語（リスニング）":{"掲載ページ":[["https://listening.tokyo/?portfolio-cat=2015t","掲載ページ"]]},
    "2015||retake||英語（リーディング）":{},
    "2016||center-main||世界史A":{"問題":[["https://www.toshin.com/center/2016/sekaishi-a_mondai_0.html","問題"]],"解説":[["https://www.toshin.com/center/2016/","解説"]]},
    "2016||center-main||世界史B":{"解説":[["https://www.toshin.com/center/2016/","解説"]]},
    "2016||center-main||倫理":{"問題":[["https://www.toshin.com/center/2016/q/rinri.pdf","問題"]],"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=405&year=2016","解答"]],"解説":[["https://www.toshin.com/center/2016/","解説"]]},
    "2016||center-main||倫理，政治・経済":{"問題":[["https://www.toshin.com/center/2016/q/rinri_seikei.pdf","問題"]],"解答":[["https://www.toshin.com/center/2016/rinri_seikei_ans.html","解答"]],"解説":[["https://www.toshin.com/center/2016/","解説"]]},
    "2016||center-main||化学":{"問題":[["https://www.toshin.com/center/2016/kagaku_mondai_0.html","問題"]],"解答":[["https://www.toshin.com/center/2016/kagaku_ans.html","解答"]],"解説":[["https://www.toshin.com/center/2016/","解説"]]},
    "2016||center-main||化学基礎":{"問題":[["https://www.toshin.com/center/2016/kagaku-kiso_mondai_0.html","問題"]],"解答":[["https://www.toshin.com/center/2016/kagaku-kiso_ans.html","解答"]],"解説":[["https://www.toshin.com/center/2016/","解説"]]},
    "2016||center-main||国語":{"問題":[["https://kyotsu.org/test/2016_%E5%9B%BD%E8%AA%9E_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://edu.chunichi.co.jp/site_home/center/pdf/2016kokugo_a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2016/","解説"]]},
    "2016||center-main||地学":{"問題":[["https://www.toshin.com/center/2016/chigaku_mondai_0.html","問題"]],"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=421&year=2016","解答"]],"解説":[["https://www.toshin.com/center/2016/","解説"]]},
    "2016||center-main||地学基礎":{"問題":[["https://www.toshin.com/center/2016/chigaku-kiso_mondai_0.html","問題"]],"解答":[["https://www.toshin.com/center/2016/chigaku-kiso_ans.html","解答"]],"解説":[["https://www.toshin.com/center/2016/","解説"]]},
    "2016||center-main||地理A":{"問題":[["https://www.toshin.com/center/2016/chiri-a_mondai_0.html","問題"]],"解答":[["https://www.toshin.com/center/2016/chiri-a_ans.html","解答"]],"解説":[["https://www.toshin.com/center/2016/","解説"]]},
    "2016||center-main||地理B":{"問題":[["https://kyotsu.org/test/2016_%E5%9C%B0%E7%90%86B_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=403&year=2016","解答"]],"解説":[["https://www.toshin.com/center/2016/","解説"]]},
    "2016||center-main||政治・経済":{"問題":[["https://www.toshin.com/center/2016/s-keizai_mondai_0.html","問題"]],"解答":[["https://www.toshin.com/center/2016/s-keizai_ans.html","解答"]],"解説":[["https://www.toshin.com/center/2016/","解説"]]},
    "2016||center-main||数学I":{"解答":[["https://www.toshin.com/center/2016/sugaku-1_ans.html","解答"]],"解説":[["https://www.toshin.com/center/2016/","解説"]]},
    "2016||center-main||数学II":{"問題":[["https://www.toshin.com/center/2016/sugaku-2_mondai_0.html","問題"]],"解答":[["https://www.toshin.com/center/2016/sugaku-2_ans.html","解答"]],"解説":[["https://www.toshin.com/center/2016/","解説"]]},
    "2016||center-main||数学II・B":{"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=417&year=2016","解答"]],"解説":[["https://www.toshin.com/center/2016/","解説"]]},
    "2016||center-main||数学I・Ａ":{"解説":[["https://www.toshin.com/center/2016/","解説"]]},
    "2016||center-main||日本史A":{"問題":[["https://www.toshin.com/center/2016/nihonshi-a_mondai_0.html","問題"]],"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=400&year=2016","解答"]],"解説":[["https://www.toshin.com/center/2016/","解説"]]},
    "2016||center-main||日本史B":{"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=401&year=2016","解答"]],"解説":[["https://www.toshin.com/center/2016/","解説"]]},
    "2016||center-main||物理":{"解説":[["https://www.toshin.com/center/2016/","解説"]]},
    "2016||center-main||物理基礎":{"問題":[["https://www.toshin.com/center/2016/butsuri-kiso_mondai_0.html","問題"]],"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=410&year=2016","解答"]],"解説":[["https://www.toshin.com/center/2016/","解説"]]},
    "2016||center-main||現代社会":{"問題":[["https://www.toshin.com/center/2016/g-shakai_mondai_0.html","問題"]],"解答":[["https://www.toshin.com/center/2016/g-shakai_ans.html","解答"]],"解説":[["https://www.toshin.com/center/2016/","解説"]]},
    "2016||center-main||生物":{"問題":[["https://www.toshin.com/center/2016/seibutsu_mondai_0.html","問題"]],"解答":[["https://www.toshin.com/center/2016/a/seibutsu_ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2016/","解説"]]},
    "2016||center-main||生物基礎":{"問題":[["https://www.toshin.com/center/2016/q/seibutsu-kiso.pdf","問題"]],"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=412&year=2016","解答"]],"解説":[["https://www.toshin.com/center/2016/","解説"]]},
    "2016||center-main||英語（リスニング）":{"解答":[["https://edu.chunichi.co.jp/pages/center2016","解答"]],"解説":[["https://www.toshin.com/center/2016/","解説"]]},
    "2016||center-main||英語（リーディング）":{"解答":[["https://www.toshin.com/center/2016/eigo_ans.html","解答"]],"解説":[["https://www.toshin.com/center/2016/","解説"]]},
    "2016||retake||化学基礎":{},
    "2016||retake||英語（リスニング）":{"掲載ページ":[["https://listening.tokyo/?portfolio-cat=2016t","掲載ページ"]]},
    "2016||retake||英語（リーディング）":{},
    "2017||center-main||世界史A":{"解説":[["https://www.toshin.com/center/2017/","解説"]]},
    "2017||center-main||世界史B":{"問題":[["https://www.toshin.com/center/2017/sekaishi-b_mondai_0.html","問題"]],"解説":[["https://www.toshin.com/center/2017/","解説"]]},
    "2017||center-main||倫理":{"解答":[["https://www.toshin.com/center/2017/rinri_ans.html","解答"]],"解説":[["https://www.toshin.com/center/2017/","解説"]]},
    "2017||center-main||倫理，政治・経済":{"解説":[["https://www.toshin.com/center/2017/","解説"]]},
    "2017||center-main||化学":{"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=443&year=2017","解答"]],"解説":[["https://www.toshin.com/center/2017/","解説"]]},
    "2017||center-main||化学基礎":{"問題":[["https://www.toshin.com/center/2017/kagaku-kiso_mondai_0.html","問題"]],"解答":[["https://www.toshin.com/center/2017/kagaku-kiso_ans.html","解答"]],"解説":[["https://www.toshin.com/center/2017/","解説"]]},
    "2017||center-main||国語":{"問題":[["https://www.toshin.com/center/2017/kokugo_mondai_0.html","問題"]],"解答":[["https://edu.chunichi.co.jp/site_home/center/pdf/2017kokugo_a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2017/","解説"]]},
    "2017||center-main||地学":{"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=445&year=2017","解答"]],"解説":[["https://www.toshin.com/center/2017/","解説"]]},
    "2017||center-main||地学基礎":{"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=437&year=2017","解答"]],"解説":[["https://www.toshin.com/center/2017/","解説"]]},
    "2017||center-main||地理A":{"解答":[["https://www.toshin.com/center/2017/chiri-a_ans.html","解答"]],"解説":[["https://www.toshin.com/center/2017/","解説"]]},
    "2017||center-main||地理B":{"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=427&year=2017","解答"]],"解説":[["https://www.toshin.com/center/2017/","解説"]]},
    "2017||center-main||政治・経済":{"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=430&year=2017","解答"]],"解説":[["https://www.toshin.com/center/2017/","解説"]]},
    "2017||center-main||数学I":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2017sugaku1_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2017/","解説"]]},
    "2017||center-main||数学II":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2017sugaku2_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2017/","解説"]]},
    "2017||center-main||数学II・B":{"問題":[["https://www.toshin.com/center/2017/sugaku-2b_mondai_0.html","問題"]],"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2017sugaku2B_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2017/","解説"]]},
    "2017||center-main||数学I・Ａ":{"問題":[["https://www.toshin.com/center/2017/sugaku-1a_mondai_0.html","問題"]],"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2017sugaku1A_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2017/","解説"]]},
    "2017||center-main||日本史A":{"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=424&year=2017","解答"]],"解説":[["https://www.toshin.com/center/2017/","解説"]]},
    "2017||center-main||日本史B":{"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=425&year=2017","解答"]],"解説":[["https://www.toshin.com/center/2017/","解説"]]},
    "2017||center-main||物理":{"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=442&year=2017","解答"]],"解説":[["https://www.toshin.com/center/2017/","解説"]]},
    "2017||center-main||物理基礎":{"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=434&year=2017","解答"]],"解説":[["https://www.toshin.com/center/2017/","解説"]]},
    "2017||center-main||現代社会":{"解答":[["https://www.toshin.com/center/2017/a/g-shakai_ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2017/","解説"]]},
    "2017||center-main||生物":{"解答":[["https://www.toshin.com/center/2017/a/seibutsu_ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2017/","解説"]]},
    "2017||center-main||生物基礎":{"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=436&year=2017","解答"]],"解説":[["https://www.toshin.com/center/2017/","解説"]]},
    "2017||center-main||英語（リスニング）":{"解答":[["https://juken-library.com/wp-content/uploads/2025/05/2017_%E8%8B%B1%E8%AA%9E%EF%BC%88%E3%83%AA%E3%82%B9%E3%83%8B%E3%83%B3%E3%82%B0%EF%BC%89_%E8%A7%A3%E7%AD%94.pdf","解答"]],"解説":[["https://www.toshin.com/center/2017/","解説"]]},
    "2017||center-main||英語（リーディング）":{"問題":[["https://www.toshin.com/center/2017/eigo_mondai_0.html","問題"]],"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=433&year=2017","解答"]],"解説":[["https://www.toshin.com/center/2017/","解説"]]},
    "2017||retake||化学基礎":{},
    "2017||retake||英語（リスニング）":{"掲載ページ":[["https://listening.tokyo/?portfolio-cat=2017t","掲載ページ"]]},
    "2017||retake||英語（リーディング）":{},
    "2018||center-main||世界史A":{"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=446&year=2018","解答"]],"解説":[["https://juken-library.com/?page_id=2332","解説"]]},
    "2018||center-main||世界史B":{"解答":[["https://www.inter-edu.com/files/center/2018/world-history-b-a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2018/","解説"]]},
    "2018||center-main||倫理":{"問題":[["https://www.toshin.com/center/2018/rinri_mondai_0.html","問題"]],"解説":[["https://www.toshin.com/center/2018/","解説"]]},
    "2018||center-main||倫理，政治・経済":{"問題":[["https://www.toshin.com/center/2018/rinri_seikei_mondai_0.html","問題"]],"解答":[["https://www.toshin.com/center/2018/rinri_seikei_ans.html","解答"]],"解説":[["https://www.toshin.com/center/2018/","解説"]]},
    "2018||center-main||化学":{"解答":[["https://www.inter-edu.com/files/center/2018/chemistry-a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2018/","解説"]]},
    "2018||center-main||化学基礎":{"問題":[["https://www.toshin.com/center/2018/kagaku-kiso_mondai_0.html","問題"]],"解答":[["https://www.inter-edu.com/files/center/2018/basic-chemistry-a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2018/","解説"]]},
    "2018||center-main||国語":{"問題":[["https://www.toshin.com/center/2018/kokugo_mondai_0.html","問題"]],"解答":[["https://www.inter-edu.com/files/center/2018/japanese-a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2018/","解説"]]},
    "2018||center-main||地学":{"解答":[["https://school.js88.com/scl_dai/center_data/question?year=2018","解答"]],"解説":[["https://www.toshin.com/center/2018/","解説"]]},
    "2018||center-main||地学基礎":{"解答":[["https://www.toshin.com/center/2018/chigaku-kiso_ans.html","解答"]],"解説":[["https://www.toshin.com/center/2018/","解説"]]},
    "2018||center-main||地理A":{"解説":[["https://juken-library.com/?page_id=2332","解説"]]},
    "2018||center-main||地理B":{"問題":[["https://www.toshin.com/center/2018/chiri-b_mondai_0.html","問題"]],"解答":[["https://www.inter-edu.com/files/center/2018/geography-b-a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2018/","解説"]]},
    "2018||center-main||政治・経済":{"問題":[["https://www.toshin.com/center/2018/s-keizai_mondai_0.html","問題"]],"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=454&year=2018","解答"]],"解説":[["https://www.toshin.com/center/2018/","解説"]]},
    "2018||center-main||数学Ⅰ":{"解答":[["https://www.inter-edu.com/files/center/2018/mathematics-1-a.pdf","解答"]],"解説":[["https://juken-library.com/?page_id=2332","解説"]]},
    "2018||center-main||数学Ⅰ・数学A":{"問題":[["https://www.toshin.com/center/2018/sugaku-1a_mondai_0.html","問題"]],"解答":[["https://www.inter-edu.com/files/center/2018/mathematics-1a-a.pdf","解答"]],"解説":[["https://juken-library.com/?page_id=2332","解説"]]},
    "2018||center-main||数学Ⅱ":{"解答":[["https://www.inter-edu.com/files/center/2018/mathematics-2-a.pdf","解答"]],"解説":[["https://juken-library.com/?page_id=2332","解説"]]},
    "2018||center-main||数学Ⅱ・数学B":{"問題":[["https://www.toshin.com/center/2018/sugaku-2b_mondai_0.html","問題"]],"解答":[["https://www.inter-edu.com/files/center/2018/mathematics-2b-a.pdf","解答"]],"解説":[["https://juken-library.com/?page_id=2332","解説"]]},
    "2018||center-main||日本史A":{"解説":[["https://juken-library.com/?page_id=2332","解説"]]},
    "2018||center-main||日本史B":{"問題":[["https://www.toshin.com/center/2018/q/nihonshi-b.pdf","問題"]],"解答":[["https://www.toshin.com/center/2018/a/nihonshi-b_ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2018/","解説"]]},
    "2018||center-main||物理":{"問題":[["https://www.toshin.com/center/2018/butsuri_mondai_0.html","問題"]],"解答":[["https://school.js88.com/scl_dai/center_data/question?year=2018","解答"]],"解説":[["https://www.toshin.com/center/2018/","解説"]]},
    "2018||center-main||物理基礎":{"問題":[["https://www.toshin.com/center/2018/butsuri-kiso_mondai_0.html","問題"]],"解説":[["https://www.toshin.com/center/2018/","解説"]]},
    "2018||center-main||現代社会":{"問題":[["https://www.toshin.com/center/2018/g-shakai_mondai_0.html","問題"]],"解説":[["https://www.toshin.com/center/2018/","解説"]]},
    "2018||center-main||生物":{"問題":[["https://www.toshin.com/center/2018/seibutsu_mondai_0.html","問題"]],"解答":[["https://school.js88.com/scl_dai/center_data/question?year=2018","解答"]],"解説":[["https://www.toshin.com/center/2018/","解説"]]},
    "2018||center-main||生物基礎":{"問題":[["https://www.toshin.com/center/2018/seibutsu-kiso_mondai_0.html","問題"]],"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=460&year=2018","解答"]],"解説":[["https://www.toshin.com/center/2018/","解説"]]},
    "2018||center-main||英語（リスニング）":{"解答":[["https://www.toshin.com/center/2018/listning_ans.html","解答"]],"解説":[["https://www.toshin.com/center/2018/","解説"]]},
    "2018||center-main||英語（リーディング）":{"問題":[["https://www.toshin.com/center/2018/eigo_mondai_0.html","問題"]],"解答":[["https://www.inter-edu.com/files/center/2018/english-a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2018/","解説"]]},
    "2018||retake||英語（リスニング）":{"問題":[["https://kyotsu.org/test/2018_%E8%8B%B1%E8%AA%9EL_%E8%BF%BD%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"掲載ページ":[["https://listening.tokyo/?portfolio-cat=2018t","掲載ページ"]]},
    "2018||retake||英語（リーディング）":{},
    "2019||center-main||世界史A":{"問題":[["https://kyotsu.org/test/2019_%E4%B8%96%E7%95%8C%E5%8F%B2A_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://juken-library.com/wp-content/uploads/2025/01/2019_%E4%B8%96%E7%95%8C%E5%8F%B2A_%E8%A7%A3%E7%AD%94.pdf","解答"]],"解説":[["https://www.toshin.com/center/2019/","解説"]]},
    "2019||center-main||世界史B":{"問題":[["https://www.toshin.com/center/2019/sekaishi-b_mondai_0.html","問題"]],"解答":[["https://www.toshin.com/center/2019/sekaishi-b_ans.html","解答"]],"解説":[["https://www.toshin.com/center/2019/","解説"]]},
    "2019||center-main||倫理":{"問題":[["https://www.toshin.com/center/2019/rinri_mondai_0.html","問題"]],"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=477&year=2019","解答"]],"解説":[["https://www.toshin.com/center/2019/","解説"]]},
    "2019||center-main||倫理，政治・経済":{"問題":[["https://www.toshin.com/center/2019/rinri_seikei_mondai_0.html","問題"]],"解答":[["https://www.toshin.com/center/2019/rinri_seikei_ans.html","解答"]],"解説":[["https://www.toshin.com/center/2019/","解説"]]},
    "2019||center-main||化学":{"問題":[["https://www.toshin.com/center/2019/kagaku_mondai_0.html","問題"]],"解答":[["https://edu.chunichi.co.jp/site_home/center/pdf/2019kagaku_a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2019/","解説"]]},
    "2019||center-main||化学基礎":{"問題":[["https://www.toshin.com/center/2019/kagaku-kiso_mondai_0.html","問題"]],"解答":[["https://juken-library.com/wp-content/uploads/2025/01/2019_%E5%8C%96%E5%AD%A6%E5%9F%BA%E7%A4%8E_%E8%A7%A3%E7%AD%94.pdf","解答"]],"解説":[["https://www.toshin.com/center/2019/","解説"]]},
    "2019||center-main||国語":{"問題":[["https://www.toshin.com/center/2019/kokugo_mondai_0.html","問題"]],"解答":[["https://www.inter-edu.com/files/center/2019/japanese-a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2019/","解説"]]},
    "2019||center-main||地学":{"問題":[["https://www.toshin.com/center/2019/chigaku_mondai_0.html","問題"]],"解答":[["https://juken-library.com/wp-content/uploads/2025/01/2019_%E5%9C%B0%E5%AD%A6_%E8%A7%A3%E7%AD%94.pdf","解答"]],"解説":[["https://www.toshin.com/center/2019/","解説"]]},
    "2019||center-main||地学基礎":{"問題":[["https://www.toshin.com/center/2019/chigaku-kiso_mondai_0.html","問題"]],"解答":[["https://www.toshin.com/center/2019/chigaku-kiso_ans.html","解答"]],"解説":[["https://www.toshin.com/center/2019/","解説"]]},
    "2019||center-main||地理A":{"問題":[["https://www.toshin.com/center/2019/chiri-a_mondai_0.html","問題"]],"解答":[["https://www.toshin.com/center/2019/chiri-a_ans.html","解答"]],"解説":[["https://www.toshin.com/center/2019/","解説"]]},
    "2019||center-main||地理B":{"問題":[["https://www.toshin.com/center/2019/chiri-b_mondai_0.html","問題"]],"解答":[["https://www.toshin.com/center/2019/chiri-b_ans.html","解答"]],"解説":[["https://www.toshin.com/center/2019/","解説"]]},
    "2019||center-main||政治・経済":{"問題":[["https://www.toshin.com/center/2019/s-keizai_mondai_0.html","問題"]],"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=478&year=2019","解答"]],"解説":[["https://www.toshin.com/center/2019/","解説"]]},
    "2019||center-main||数学Ⅰ":{"問題":[["https://www.toshin.com/center/2019/sugaku-1_mondai_0.html","問題"]],"解答":[["https://www.inter-edu.com/files/center/2019/mathematics-1-a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2019/","解説"]]},
    "2019||center-main||数学Ⅰ・数学A":{"問題":[["https://kyotsu.org/test/2019_%E6%95%B0%E5%AD%A6IA_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.inter-edu.com/files/center/2019/mathematics-1a-a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2019/","解説"]]},
    "2019||center-main||数学Ⅱ":{"問題":[["https://www.toshin.com/center/2019/q/sugaku-2.pdf","問題"]],"解答":[["https://www.toshin.com/center/2019/a/sugaku-2_ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/2019/","解説"]]},
    "2019||center-main||数学Ⅱ・数学B":{"問題":[["https://www.toshin.com/center/2019/q/sugaku-2b.pdf","問題"]],"解答":[["https://www.inter-edu.com/files/center/2019/mathematics-2b-a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2019/","解説"]]},
    "2019||center-main||日本史A":{"問題":[["https://www.toshin.com/center/2019/q/nihonshi-a.pdf","問題"]],"解答":[["https://www.toshin.com/center/2019/nihonshi-a_ans.html","解答"]],"解説":[["https://www.toshin.com/center/2019/","解説"]]},
    "2019||center-main||日本史B":{"問題":[["https://www.toshin.com/center/2019/nihonshi-b_mondai_0.html","問題"]],"解答":[["https://juken-library.com/wp-content/uploads/2025/01/2019_%E6%97%A5%E6%9C%AC%E5%8F%B2B_%E8%A7%A3%E7%AD%94.pdf","解答"]],"解説":[["https://www.toshin.com/center/2019/","解説"]]},
    "2019||center-main||物理":{"問題":[["https://www.toshin.com/center/2019/butsuri_mondai_0.html","問題"]],"解答":[["https://edu.chunichi.co.jp/site_home/center/pdf/2019butsuri_a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2019/","解説"]]},
    "2019||center-main||物理基礎":{"問題":[["https://www.toshin.com/center/2019/butsuri-kiso_mondai_0.html","問題"]],"解答":[["https://www.toshin.com/center/2019/butsuri-kiso_ans.html","解答"]],"解説":[["https://www.toshin.com/center/2019/","解説"]]},
    "2019||center-main||現代社会":{"問題":[["https://www.toshin.com/center/2019/g-shakai_mondai_0.html","問題"]],"解答":[["https://juken-library.com/wp-content/uploads/2025/01/2019_%E7%8F%BE%E4%BB%A3%E7%A4%BE%E4%BC%9A_%E8%A7%A3%E7%AD%94.pdf","解答"]],"解説":[["https://www.toshin.com/center/2019/","解説"]]},
    "2019||center-main||生物":{"問題":[["https://www.toshin.com/center/2019/seibutsu_mondai_0.html","問題"]],"解答":[["https://www.toshin.com/center/2019/seibutsu_ans.html","解答"]],"解説":[["https://www.toshin.com/center/2019/","解説"]]},
    "2019||center-main||生物基礎":{"問題":[["https://www.toshin.com/center/2019/seibutsu-kiso_mondai_0.html","問題"]],"解答":[["https://www.toshin.com/center/2019/seibutsu-kiso_ans.html","解答"]],"解説":[["https://www.toshin.com/center/2019/","解説"]]},
    "2019||center-main||英語（リスニング）":{"問題":[["https://www.toshin.com/center/2019/listning_mondai_0.html","問題"]],"解答":[["https://edu.chunichi.co.jp/site_home/center/pdf/2019English-L_a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2019/","解説"]]},
    "2019||center-main||英語（リーディング）":{"問題":[["https://www.toshin.com/center/2019/eigo_mondai_0.html","問題"]],"解答":[["https://edu.chunichi.co.jp/site_home/center/pdf/2019English_a.pdf","解答"]],"解説":[["https://www.toshin.com/center/2019/","解説"]]},
    "2019||retake||数学Ⅰ・数学A":{"掲載ページ":[["https://www.ozl.jp/center/2019tui/index.html","掲載ページ"]]},
    "2019||retake||数学Ⅱ・数学B":{"掲載ページ":[["https://www.ozl.jp/center/2019tui/index.html","掲載ページ"]]},
    "2019||retake||英語（リスニング）":{"掲載ページ":[["https://www.mmsankosho.com/centerlistening2019tuisi/","掲載ページ"]]},
    "2019||retake||英語（リーディング）":{},
    "2020||center-main||世界史A":{"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=494&year=2020","解答"]],"解説":[["https://juken-library.com/?page_id=1845","解説"]]},
    "2020||center-main||世界史B":{"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=495&year=2020","解答"]],"解説":[["https://www.toshin.com/center/","解説"]]},
    "2020||center-main||倫理":{"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=501&year=2020","解答"]],"解説":[["https://www.toshin.com/center/","解説"]]},
    "2020||center-main||倫理，政治・経済":{"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=503&year=2020","解答"]],"解説":[["https://www.toshin.com/center/","解説"]]},
    "2020||center-main||化学":{"解説":[["https://www.toshin.com/center/","解説"]]},
    "2020||center-main||化学基礎":{"解説":[["https://www.toshin.com/center/","解説"]]},
    "2020||center-main||国語":{"解答":[["https://www.toshin.com/center/a/kokugo_ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/","解説"]]},
    "2020||center-main||地学":{"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=516&year=2020","解答"]],"解説":[["https://www.toshin.com/center/","解説"]]},
    "2020||center-main||地学基礎":{"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=508&year=2020","解答"]],"解説":[["https://www.toshin.com/center/","解説"]]},
    "2020||center-main||地理A":{"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=498&year=2020","解答"]],"解説":[["https://juken-library.com/?page_id=1845","解説"]]},
    "2020||center-main||地理B":{"問題":[["https://kyotsu.org/test/2020_%E5%9C%B0%E7%90%86B_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=499&year=2020","解答"]],"解説":[["https://www.toshin.com/center/","解説"]]},
    "2020||center-main||政治・経済":{"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=502&year=2020","解答"]],"解説":[["https://www.toshin.com/center/","解説"]]},
    "2020||center-main||数学I":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2020sugaku1_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/","解説"]]},
    "2020||center-main||数学II":{"解答":[["https://school.js88.com/sd_article/dai/dai_center_data/pdf/2020sugaku2_Ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/","解説"]]},
    "2020||center-main||数学Ⅰ・数学A":{"解答":[["https://www.toshin.com/center/a/sugaku-1a_ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/","解説"]]},
    "2020||center-main||数学Ⅱ・数学B":{"解答":[["https://www.toshin.com/center/a/sugaku-2b_ans.pdf","解答"]],"解説":[["https://www.toshin.com/center/","解説"]]},
    "2020||center-main||日本史A":{"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=496&year=2020","解答"]],"解説":[["https://juken-library.com/?page_id=1845","解説"]]},
    "2020||center-main||日本史B":{"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=497&year=2020","解答"]],"解説":[["https://www.toshin.com/center/","解説"]]},
    "2020||center-main||物理":{"問題":[["https://kyotsu.org/test/2020_%E7%89%A9%E7%90%86_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://edu.chunichi.co.jp/site_home/center/pdf/2020butsuri_a.pdf","解答"]],"解説":[["https://www.toshin.com/center/","解説"]]},
    "2020||center-main||物理基礎":{"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=505&year=2020","解答"]],"解説":[["https://www.toshin.com/center/","解説"]]},
    "2020||center-main||現代社会":{"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=500&year=2020","解答"]],"解説":[["https://www.toshin.com/center/","解説"]]},
    "2020||center-main||生物":{"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=515&year=2020","解答"]],"解説":[["https://www.toshin.com/center/","解説"]]},
    "2020||center-main||生物基礎":{"解答":[["https://school.js88.com/scl_dai/center_data/self_mark?subject_list_id=507&year=2020","解答"]],"解説":[["https://www.toshin.com/center/","解説"]]},
    "2020||center-main||英語（リスニング）":{"解答":[["https://edu.chunichi.co.jp/site_home/center/pdf/2020English-L_a.pdf","解答"]],"解説":[["https://www.toshin.com/center/","解説"]]},
    "2020||center-main||英語（リーディング）":{"問題":[["https://kyotsu.org/test/2020_%E8%8B%B1%E8%AA%9ER_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://edu.chunichi.co.jp/site_home/center/pdf/2020English_a.pdf","解答"]],"解説":[["https://www.toshin.com/center/","解説"]]},
    "2020||retake||世界史B":{"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E4%B8%96%E7%95%8C%E5%8F%B2b%E3%80%912020%E5%B9%B4-%E8%BF%BD%E8%A9%A6-%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2020||retake||倫理":{"問題":[["https://kyotsu.org/test/2020_%E5%80%AB%E7%90%86_%E8%BF%BD%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E5%80%AB%E7%90%86%E3%80%912020%E5%B9%B4-%E8%BF%BD%E8%A9%A6-%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2020||retake||倫理，政治・経済":{"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E5%80%AB%E7%90%86%E3%83%BB%E6%94%BF%E6%B2%BB%E7%B5%8C%E6%B8%88%E3%80%912020%E5%B9%B4-%E8%BF%BD%E8%A9%A6-%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2020||retake||化学":{"解説":[["https://note.com/38mol/n/n9e15f17f7044","解説"]],"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E5%8C%96%E5%AD%A6%E3%80%912020%E5%B9%B4-%E8%BF%BD%E8%A9%A6-%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2020||retake||化学基礎":{"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E5%8C%96%E5%AD%A6%E5%9F%BA%E7%A4%8E%E3%80%912020%E5%B9%B4-%E8%BF%BD%E8%A9%A6-%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2020||retake||国語":{"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E5%9B%BD%E8%AA%9E%E3%80%912020%E5%B9%B4-%E8%BF%BD%E8%A9%A6-%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2020||retake||地学":{"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E5%9C%B0%E5%AD%A6%E3%80%912020%E5%B9%B4-%E8%BF%BD%E8%A9%A6-%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2020||retake||地学基礎":{"解説":[["https://www.mugaku.net/detail.php?id=22238","解説"]],"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E5%9C%B0%E5%AD%A6%E5%9F%BA%E7%A4%8E%E3%80%912020%E5%B9%B4-%E8%BF%BD%E8%A9%A6-%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2020||retake||地理B":{"問題":[["https://kyotsu.org/test/2020_%E5%9C%B0%E7%90%86B_%E8%BF%BD%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解説":[["https://www.youtube.com/playlist?list=PLUghhx20IdXDQJyjNH2g5vMXkQ0p8M5UF","解説"]],"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E5%9C%B0%E7%90%86b%E3%80%912020%E5%B9%B4-%E8%BF%BD%E8%A9%A6-%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2020||retake||政治・経済":{"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E6%94%BF%E6%B2%BB%E7%B5%8C%E6%B8%88%E3%80%912020%E5%B9%B4-%E8%BF%BD%E8%A9%A6-%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2020||retake||数学Ⅰ・数学A":{"解説":[["https://www.ozl.jp/center/2020tui/index.html","解説"]]},
    "2020||retake||数学Ⅱ・数学B":{"掲載ページ":[["https://www.kyotsutest.net/?p=802","掲載ページ"]]},
    "2020||retake||日本史B":{"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E6%97%A5%E6%9C%AC%E5%8F%B2b%E3%80%912020%E5%B9%B4-%E8%BF%BD%E8%A9%A6-%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2020||retake||物理":{"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E7%89%A9%E7%90%86%E3%80%912020%E5%B9%B4-%E8%BF%BD%E8%A9%A6-%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2020||retake||物理基礎":{"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E7%89%A9%E7%90%86%E5%9F%BA%E7%A4%8E%E3%80%912020%E5%B9%B4-%E8%BF%BD%E8%A9%A6-%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2020||retake||現代社会":{"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E7%8F%BE%E4%BB%A3%E7%A4%BE%E4%BC%9A%E3%80%912020%E5%B9%B4-%E8%BF%BD%E8%A9%A6-%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2020||retake||生物":{"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E7%94%9F%E7%89%A9%E3%80%912020%E5%B9%B4-%E8%BF%BD%E8%A9%A6-%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2020||retake||生物基礎":{"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E7%94%9F%E7%89%A9%E5%9F%BA%E7%A4%8E%E3%80%912020%E5%B9%B4-%E8%BF%BD%E8%A9%A6-%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2020||retake||英語（リスニング）":{"解説":[["https://www.mmsankosho.com/center-listening-2020-tuisi/","解説"]],"掲載ページ":[["https://www.mmsankosho.com/center-listening-2020-tuisi/","掲載ページ"]]},
    "2020||retake||英語（リーディング）":{},
    "2021||main||世界史A":{"問題":[["https://www.toshin.com/kyotsutest/2021/sekaishi-a_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2021/data/93/sekaishi-a_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2021/analysis_sekaishi-a.html","解説（設問別分析）"]]},
    "2021||main||世界史B":{"問題":[["https://kyotsu.org/test/2021_%E4%B8%96%E7%95%8C%E5%8F%B2B_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2021/data/154/sekaishi-b_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2021/data/442/sekaishi-b.pdf","解説"]]},
    "2021||main||倫理":{"問題":[["https://www.toshin.com/kyotsutest/2021/rinri_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2021/data/107/rinri_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2021/data/446/rinri.pdf","解説"]]},
    "2021||main||倫理，政治・経済":{"問題":[["https://www.toshin.com/kyotsutest/2021/rinri_seikei_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2021/data/106/rinri-seikei_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2021/data/445/rinri_seikei.pdf","解説"]]},
    "2021||main||化学":{"問題":[["https://www.toshin.com/kyotsutest/2021/kagaku_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2021/data/358/kagaku_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2021/data/436/kagaku.pdf","解説"]]},
    "2021||main||化学基礎":{"問題":[["https://www.toshin.com/kyotsutest/2021/kagaku-kiso_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2021/data/270/kagaku-kiso_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2021/data/437/kagaku-kiso.pdf","解説"]]},
    "2021||main||国語":{"問題":[["https://www.toshin.com/kyotsutest/2021/kokugo_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2021/data/161/kokugo_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2021/data/449/kobunn.pdf","解説（古典）"],["https://www.toshin.com/kyotsutest/2021/analysis_kokugo.html","解説（設問別分析）"]]},
    "2021||main||地学":{"問題":[["https://www.toshin.com/kyotsutest/2021/chigaku_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2021/data/352/chigaku_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2021/data/434/chigaku.pdf","解説"]]},
    "2021||main||地学基礎":{"問題":[["https://www.toshin.com/kyotsutest/2021/chigaku-kiso_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2021/data/236/chigaku-kiso_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2021/data/435/chigaku-kiso.pdf","解説"]]},
    "2021||main||地理A":{"問題":[["https://www.toshin.com/kyotsutest/2021/chiri-a_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2021/data/72/chiri-a_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2021/analysis_chiri-a.html","解説（設問別分析）"]]},
    "2021||main||地理B":{"問題":[["https://kyotsu.org/test/2021_%E5%9C%B0%E7%90%86B_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2021/data/81/chiri-b_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2021/data/444/chiri-b.pdf","解説"]]},
    "2021||main||政治・経済":{"問題":[["https://www.toshin.com/kyotsutest/2021/s-keizai_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2021/data/130/s-keizai_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2021/data/443/s-keizai.pdf","解説"]]},
    "2021||main||数学Ⅰ":{"問題":[["https://www.toshin.com/kyotsutest/2021/suugaku-1_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2021/data/304/sugaku-1_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2021/analysis_suugaku-1.html","解説（設問別分析）"]]},
    "2021||main||数学Ⅰ・数学A":{"問題":[["https://www.toshin.com/kyotsutest/2021/suugaku-1a_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2021/data/293/sugaku-1a_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2021/data/447/suugaku-1a.pdf","解説"]]},
    "2021||main||数学Ⅱ":{"問題":[["https://www.toshin.com/kyotsutest/2021/suugaku2_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2021/data/323/sugaku-2_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2021/analysis_suugaku2.html","解説（設問別分析）"]]},
    "2021||main||数学Ⅱ・数学B":{"問題":[["https://www.toshin.com/kyotsutest/2021/suugaku2b_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2021/data/319/sugaku-2b_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2021/data/448/suugaku-2b.pdf","解説"]]},
    "2021||main||日本史A":{"問題":[["https://www.toshin.com/kyotsutest/2021/nihonshi-a_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2021/data/87/nihonshi-a_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2021/analysis_nihonshi-a.html","解説（設問別分析）"]]},
    "2021||main||日本史B":{"問題":[["https://www.toshin.com/kyotsutest/2021/nihonshi-b_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2021/data/70/nihonshi-b_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2021/data/440/nihonshi-b.pdf","解説"]]},
    "2021||main||物理":{"問題":[["https://www.toshin.com/kyotsutest/2021/butsuri_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2021/data/354/butsuri_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2021/data/432/butsuri.pdf","解説"]]},
    "2021||main||物理基礎":{"問題":[["https://www.toshin.com/kyotsutest/2021/butsuri-kiso_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2021/data/265/butsuri-kiso_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2021/data/433/butsuri-kiso.pdf","解説"]]},
    "2021||main||現代社会":{"問題":[["https://www.toshin.com/kyotsutest/2021/g-shakai_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2021/data/141/g-shakai_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2021/data/441/g-shakai.pdf","解説"]]},
    "2021||main||生物":{"問題":[["https://www.toshin.com/kyotsutest/2021/seibutsu_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2021/data/356/seibutsu_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2021/data/438/seibutsu.pdf","解説"]]},
    "2021||main||生物基礎":{"問題":[["https://www.toshin.com/kyotsutest/2021/seibutsu-kiso_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2021/data/255/seibutsu-kiso_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2021/data/439/seibutsu-kiso.pdf","解説"]]},
    "2021||main||英語（リスニング）":{"問題":[["https://www.toshin.com/kyotsutest/2021/listening_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2021/data/216/listening_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2021/data/430/listening.pdf","解説"]]},
    "2021||main||英語（リーディング）":{"問題":[["https://kyotsu.org/test/2021_%E8%8B%B1%E8%AA%9ER_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2021/data/220/eigo_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2021/data/429/reading.pdf","解説"]]},
    "2021||retake||世界史A":{},
    "2021||retake||世界史B":{"解説":[["https://brg.plus/courses/%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88-%E6%AD%B4%E5%8F%B2%E7%B7%8F%E5%90%88%E3%83%BB%E4%B8%96%E7%95%8C%E5%8F%B2%E6%8E%A2%E6%B1%82-%E9%81%8E%E5%8E%BB%E5%95%8F%E5%85%A8%E5%B0%8F%E5%95%8F%E8%A7%A3/","解説"]],"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E4%B8%96%E7%95%8C%E5%8F%B2b%E3%80%912021%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2021||retake||倫理":{"解説":[["https://brg.plus/courses/%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88-%E5%85%AC%E5%85%B1%E3%83%BB%E5%80%AB%E7%90%86-%E9%81%8E%E5%8E%BB%E5%95%8F%E5%85%A8%E5%B0%8F%E5%95%8F%E8%A7%A3%E8%AA%AC%EF%BC%882027%E5%B9%B4%E5%BA%A6/","解説"]],"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E5%80%AB%E7%90%86%E3%80%912021%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2021||retake||倫理，政治・経済":{"解説":[["https://brg.plus/courses/","解説"]],"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E5%80%AB%E7%90%86%E3%83%BB%E6%94%BF%E6%B2%BB%E7%B5%8C%E6%B8%88%E3%80%912021%E5%B9%B4%E8%BF%BD%E8%A9%A6%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2021||retake||化学":{"解説":[["https://note.com/rapparapa18/n/ncc065238bdcb","解説"]],"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E5%8C%96%E5%AD%A6%E3%80%912021%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2021||retake||化学基礎":{"解説":[["https://brg.plus/courses/%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88-%E5%8C%96%E5%AD%A6%E5%9F%BA%E7%A4%8E-%E9%81%8E%E5%8E%BB%E5%95%8F%E5%85%A8%E5%B0%8F%E5%95%8F%E8%A7%A3%E8%AA%AC%EF%BC%882027%E5%B9%B4%E5%BA%A6%E5%85%A5/","解説"]],"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E5%8C%96%E5%AD%A6%E5%9F%BA%E7%A4%8E%E3%80%912021%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2021||retake||国語":{"解説":[["https://kotohogi.page/kokugo_kyoute_2021_tsui_1/","解説"]],"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E5%9B%BD%E8%AA%9E%E3%80%912021%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2021||retake||地学":{"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E5%9C%B0%E5%AD%A6%E3%80%912021%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2021||retake||地学基礎":{"解説":[["https://brg.plus/courses/%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88-%E5%9C%B0%E5%AD%A6%E5%9F%BA%E7%A4%8E-%E9%81%8E%E5%8E%BB%E5%95%8F%E5%85%A8%E5%B0%8F%E5%95%8F%E8%A7%A3%E8%AA%AC%EF%BC%882027%E5%B9%B4%E5%BA%A6%E5%85%A5/","解説"]],"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E5%9C%B0%E5%AD%A6%E5%9F%BA%E7%A4%8E%E3%80%912021%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2021||retake||地理A":{},
    "2021||retake||地理B":{"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E5%9C%B0%E7%90%86b%E3%80%912021%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2021||retake||情報関係基礎":{"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E6%83%85%E5%A0%B1%E9%96%A2%E4%BF%82%E5%9F%BA%E7%A4%8E%E3%80%912021%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2021||retake||政治・経済":{"解説":[["https://brg.plus/courses/%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88-%E5%85%AC%E5%85%B1%E3%83%BB%E6%94%BF%E6%B2%BB%E7%B5%8C%E6%B8%88-%E9%81%8E%E5%8E%BB%E5%95%8F%E5%85%A8%E5%B0%8F%E5%95%8F%E8%A7%A3%E8%AA%AC%EF%BC%882027/","解説"]],"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E6%94%BF%E6%B2%BB%E7%B5%8C%E6%B8%88%E3%80%912021%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2021||retake||数学Ⅰ":{},
    "2021||retake||数学Ⅰ・数学A":{"解説":[["https://www.ozl.jp/dnk/2021tui/index.html","解説"]]},
    "2021||retake||数学Ⅱ":{"解説":[["https://sasakima.com/%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88","解説"]],"掲載ページ":[["https://sasakima.com/wp-content/uploads/2023/04/2629671446aa8e6dcc51d3ba6931e458.pdf","掲載ページ"]]},
    "2021||retake||数学Ⅱ・数学B":{"解説":[["https://www.ozl.jp/dnk/2021tui/index.html","解説"]],"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E6%95%B0%E5%AD%A6%E2%85%B1b%E3%80%912021%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2021||retake||日本史A":{},
    "2021||retake||日本史B":{"解説":[["https://brg.plus/courses/%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88-%E6%AD%B4%E5%8F%B2%E7%B7%8F%E5%90%88%E3%83%BB%E6%97%A5%E6%9C%AC%E5%8F%B2%E6%8E%A2%E6%B1%82-%E9%81%8E%E5%8E%BB%E5%95%8F%E5%85%A8%E5%B0%8F%E5%95%8F%E8%A7%A3/","解説"]],"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E6%97%A5%E6%9C%AC%E5%8F%B2b%E3%80%912021%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2021||retake||物理":{"解説":[["https://physics.educationalconsulting.jp/?page_id=2775","解説"]],"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E7%89%A9%E7%90%86%E3%80%912021%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2021||retake||物理基礎":{"解説":[["https://brg.plus/courses/%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88-%E7%89%A9%E7%90%86%E5%9F%BA%E7%A4%8E-%E9%81%8E%E5%8E%BB%E5%95%8F%E5%85%A8%E5%B0%8F%E5%95%8F%E8%A7%A3%E8%AA%AC%EF%BC%882027%E5%B9%B4%E5%BA%A6%E5%85%A5/","解説"]],"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E7%89%A9%E7%90%86%E5%9F%BA%E7%A4%8E%E3%80%912021%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2021||retake||現代社会":{"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E7%8F%BE%E4%BB%A3%E7%A4%BE%E4%BC%9A%E3%80%912021%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2021||retake||生物":{"解説":[["https://note.com/openyourtextbook/n/nbeed77d875c3","解説"]],"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E7%94%9F%E7%89%A9%E3%80%912021%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2021||retake||生物基礎":{"解説":[["https://i-my-mine.hatenablog.com/entry/2021/02/01/2021%E5%B9%B4%E5%BA%A6%E5%A4%A7%E5%AD%A6%E5%85%A5%E8%A9%A6%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E7%AC%AC%E4%BA%8C%E6%97%A5%E7%A8%8B_%E7%94%9F%E7%89%A9_%E6%89%80%E6%84%9F","解説"]],"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E7%94%9F%E7%89%A9%E5%9F%BA%E7%A4%8E%E3%80%912021%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2021||retake||英語（リスニング）":{"解説":[["https://nekoeigo.net/tag/2021-2","解説"]],"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E8%8B%B1%E8%AA%9E%E3%80%912021%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2021||retake||英語（リーディング）":{"問題":[["https://kyotsu.org/test/2021_%E8%8B%B1%E8%AA%9ER_%E8%BF%BD%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解説":[["https://nekoeigo.net/tag/2021-2","解説"]],"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E8%8B%B1%E8%AA%9E%E3%80%912021%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2022||main||世界史A":{"問題":[["https://www.toshin.com/kyotsutest/2022/sekaishi-a_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2022/data/318/sekaishi-a_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2022/analysis_sekaishi-a.html","解説（設問別分析）"]]},
    "2022||main||世界史B":{"問題":[["https://www.toshin.com/kyotsutest/2022/sekaishi-b_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2022/data/315/sekaishi-b_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2022/data/635/sekaishi-b.pdf","解説"]]},
    "2022||main||倫理":{"問題":[["https://www.toshin.com/kyotsutest/2022/rinri_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2022/data/437/rinri_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2022/data/639/rinri.pdf","解説"]]},
    "2022||main||倫理，政治・経済":{"問題":[["https://www.toshin.com/kyotsutest/2022/rinri_seikei_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2022/data/390/rinri-seikei_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2022/data/641/rinri-seikei.pdf","解説"]]},
    "2022||main||化学":{"問題":[["https://www.toshin.com/kyotsutest/2022/kagaku_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2022/data/607/kagaku_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2022/data/632/kagaku.pdf","解説"]]},
    "2022||main||化学基礎":{"問題":[["https://www.toshin.com/kyotsutest/2022/kagaku-kiso_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2022/data/488/kagaku-kiso_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2022/data/649/kagaku-kiso.pdf","解説"]]},
    "2022||main||国語":{"問題":[["https://www.toshin.com/kyotsutest/2022/kokugo_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2022/data/364/kokugo_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2022/data/643/kobunn.pdf","解説（古典）"],["https://www.toshin.com/kyotsutest/2022/analysis_kokugo.html","解説（設問別分析）"]]},
    "2022||main||地学":{"問題":[["https://www.toshin.com/kyotsutest/2022/chigaku_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2022/data/600/chigaku_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2022/data/634/chigaku.pdf","解説"]]},
    "2022||main||地学基礎":{"問題":[["https://www.toshin.com/kyotsutest/2022/chigaku-kiso_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2022/data/486/chigaku-kiso_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2022/data/629/chigaku-kiso.pdf","解説"]]},
    "2022||main||地理A":{"問題":[["https://kyotsu.org/test/2022_%E5%9C%B0%E7%90%86A_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2022/data/249/chiri-a_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2022/analysis_chiri-a.html","解説（設問別分析）"]]},
    "2022||main||地理B":{"問題":[["https://kyotsu.org/test/2022_%E5%9C%B0%E7%90%86B_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2022/data/255/chiri-b_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2022/data/637/chiri-b.pdf","解説"]]},
    "2022||main||政治・経済":{"問題":[["https://www.toshin.com/kyotsutest/2022/s-keizai_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2022/data/411/s-keizai_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2022/data/640/s-keizai.pdf","解説"]]},
    "2022||main||数学Ⅰ":{"問題":[["https://kyotsu.org/test/2022_%E6%95%B0%E5%AD%A6I_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2022/data/525/sugaku-1_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2022/analysis_suugaku-1.html","解説（設問別分析）"]]},
    "2022||main||数学Ⅰ・数学A":{"問題":[["https://kyotsu.org/test/2022_%E6%95%B0%E5%AD%A6IA_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2022/data/527/sugaku-1a_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2022/data/630/sugaku-1a.pdf","解説"]]},
    "2022||main||数学Ⅱ":{"問題":[["https://www.toshin.com/kyotsutest/2022/suugaku2_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2022/data/548/sugaku-2_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2022/analysis_suugaku2.html","解説（設問別分析）"]]},
    "2022||main||数学Ⅱ・数学B":{"問題":[["https://www.toshin.com/kyotsutest/2022/suugaku2b_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2022/answer_suugaku2b.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2022/data/646/sugaku-2b.pdf","解説"]]},
    "2022||main||日本史A":{"問題":[["https://kyotsu.org/test/2022_%E6%97%A5%E6%9C%AC%E5%8F%B2A_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2022/data/269/nihonshi-a_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2022/analysis_nihonshi-a.html","解説（設問別分析）"]]},
    "2022||main||日本史B":{"問題":[["https://www.toshin.com/kyotsutest/2022/nihonshi-b_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2022/data/243/nihonshi-b_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2022/data/636/nihonshi-b.pdf","解説"]]},
    "2022||main||物理":{"問題":[["https://www.toshin.com/kyotsutest/2022/butsuri_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2022/data/625/butsuri_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2022/data/631/butsuri.pdf","解説"]]},
    "2022||main||物理基礎":{"問題":[["https://www.toshin.com/kyotsutest/2022/butsuri-kiso_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2022/data/495/butsuri-kiso_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2022/data/648/butsuri-kiso.pdf","解説"]]},
    "2022||main||現代社会":{"問題":[["https://www.toshin.com/kyotsutest/2022/g-shakai_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2022/data/376/g-shakai_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2022/data/638/g-shakai.pdf","解説"]]},
    "2022||main||生物":{"問題":[["https://www.toshin.com/kyotsutest/2022/seibutsu_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2022/data/604/seibutsu_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2022/data/633/seibutsu.pdf","解説"]]},
    "2022||main||生物基礎":{"問題":[["https://kyotsu.org/test/2022_%E7%94%9F%E7%89%A9%E5%9F%BA%E7%A4%8E_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2022/data/491/seibutsu-kiso_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2022/data/652/seibutsu-kiso.pdf","解説"]]},
    "2022||main||英語（リスニング）":{"問題":[["https://www.toshin.com/kyotsutest/2022/listening_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2022/data/439/listening_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2022/data/645/listening.pdf","解説"]]},
    "2022||main||英語（リーディング）":{"問題":[["https://www.toshin.com/kyotsutest/2022/reading_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2022/data/436/eigo_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2022/data/647/eigo.pdf","解説"]]},
    "2022||retake||世界史A":{},
    "2022||retake||世界史B":{"解説":[["https://bunbunshinrosaijki.hatenablog.com/entry/2022/02/01/193213","解説"]],"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E4%B8%96%E7%95%8C%E5%8F%B2b%E3%80%912022%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2022||retake||倫理":{"解説":[["https://brg.plus/courses/%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88-%E5%85%AC%E5%85%B1%E3%83%BB%E5%80%AB%E7%90%86-%E9%81%8E%E5%8E%BB%E5%95%8F%E5%85%A8%E5%B0%8F%E5%95%8F%E8%A7%A3%E8%AA%AC%EF%BC%882027%E5%B9%B4%E5%BA%A6/","解説"]],"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E5%80%AB%E7%90%86%E3%80%912022%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2022||retake||倫理，政治・経済":{"解説":[["https://brg.plus/courses/","解説"]],"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E5%80%AB%E7%90%86%E3%83%BB%E6%94%BF%E6%B2%BB%E7%B5%8C%E6%B8%88%E3%80%912022%E5%B9%B4%E8%BF%BD%E8%A9%A6%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2022||retake||化学":{"解説":[["https://brg.plus/courses/%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88-%E5%8C%96%E5%AD%A6-%E9%81%8E%E5%8E%BB%E5%95%8F%E5%85%A8%E5%B0%8F%E5%95%8F%E8%A7%A3%E8%AA%AC%EF%BC%882027%E5%B9%B4%E5%BA%A6%E5%85%A5%E8%A9%A6%E5%AF%BE/","解説"]],"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E5%8C%96%E5%AD%A6%E3%80%912022%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2022||retake||化学基礎":{"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E5%8C%96%E5%AD%A6%E5%9F%BA%E7%A4%8E%E3%80%912022%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2022||retake||国語":{"解説":[["https://kotohogi.page/kokugo_kyoute_2022_tsui_1/","解説"]],"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E5%9B%BD%E8%AA%9E%E3%80%912022%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2022||retake||地学":{"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E5%9C%B0%E5%AD%A6%E3%80%912022%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2022||retake||地学基礎":{"解説":[["https://brg.plus/courses/%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88-%E5%9C%B0%E5%AD%A6%E5%9F%BA%E7%A4%8E-%E9%81%8E%E5%8E%BB%E5%95%8F%E5%85%A8%E5%B0%8F%E5%95%8F%E8%A7%A3%E8%AA%AC%EF%BC%882027%E5%B9%B4%E5%BA%A6%E5%85%A5/","解説"]],"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E5%9C%B0%E5%AD%A6%E5%9F%BA%E7%A4%8E%E3%80%912022%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2022||retake||地理B":{"解説":[["https://www.youtube.com/playlist?list=PLmrVKouFINQS5PGDX-L1JpXlMZF8FAJbp","解説"]],"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E5%9C%B0%E7%90%86b%E3%80%912022%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2022||retake||情報関係基礎":{"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E6%83%85%E5%A0%B1%E3%80%912022%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2022||retake||政治・経済":{"解説":[["https://brg.plus/courses/%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88-%E5%85%AC%E5%85%B1%E3%83%BB%E6%94%BF%E6%B2%BB%E7%B5%8C%E6%B8%88-%E9%81%8E%E5%8E%BB%E5%95%8F%E5%85%A8%E5%B0%8F%E5%95%8F%E8%A7%A3%E8%AA%AC%EF%BC%882027/","解説"]],"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E6%94%BF%E6%B2%BB%E7%B5%8C%E6%B8%88%E3%80%912022%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2022||retake||数学Ⅰ・数学A":{"解説":[["https://www.ozl.jp/dnk/2022tui/index.html","解説"]],"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E6%95%B0%E5%AD%A6%E2%85%B0a%E3%80%912022%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2022||retake||数学Ⅱ・数学B":{"解説":[["https://www.ozl.jp/dnk/2022tui/index.html","解説"]],"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E6%95%B0%E5%AD%A6%E2%85%B1b%E3%80%912022%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2022||retake||日本史B":{"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E6%97%A5%E6%9C%AC%E5%8F%B2b%E3%80%912022%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2022||retake||物理":{"問題":[["https://kyotsu.org/test/2022_%E7%89%A9%E7%90%86_%E8%BF%BD%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解説":[["https://physicmath.net/7599/","解説"]],"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E7%89%A9%E7%90%86%E3%80%912022%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2022||retake||物理基礎":{"解説":[["https://brg.plus/courses/%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88-%E7%89%A9%E7%90%86%E5%9F%BA%E7%A4%8E-%E9%81%8E%E5%8E%BB%E5%95%8F%E5%85%A8%E5%B0%8F%E5%95%8F%E8%A7%A3%E8%AA%AC%EF%BC%882027%E5%B9%B4%E5%BA%A6%E5%85%A5/","解説"]],"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E7%89%A9%E7%90%86%E5%9F%BA%E7%A4%8E%E3%80%912022%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2022||retake||現代社会":{"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E7%8F%BE%E4%BB%A3%E7%A4%BE%E4%BC%9A%E3%80%912022%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2022||retake||生物":{"解説":[["https://i-my-mine.hatenablog.com/entry/2022/02/02/2022%E5%B9%B4%E5%BA%A6%E5%A4%A7%E5%AD%A6%E5%85%A5%E8%A9%A6%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%EF%BC%92%E6%AC%A1%E6%97%A5%E7%A8%8B_%E7%94%9F%E7%89%A9_%E6%89%80%E6%84%9F","解説"]],"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E7%94%9F%E7%89%A9%E3%80%912022%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2022||retake||生物基礎":{"解説":[["https://i-my-mine.hatenablog.com/entry/2022/02/02/2022%E5%B9%B4%E5%BA%A6%E5%A4%A7%E5%AD%A6%E5%85%A5%E8%A9%A6%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%EF%BC%92%E6%AC%A1%E6%97%A5%E7%A8%8B_%E7%94%9F%E7%89%A9%E5%9F%BA%E7%A4%8E_%E6%89%80%E6%84%9F","解説"]],"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E7%94%9F%E7%89%A9%E5%9F%BA%E7%A4%8E%E3%80%912022%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2022||retake||英語（リスニング）":{"掲載ページ":[["https://kyotsutest.jp/?page_id=2673","掲載ページ"]]},
    "2022||retake||英語（リーディング）":{"問題":[["https://kyotsu.org/test/2022_%E8%8B%B1%E8%AA%9ER_%E8%BF%BD%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解説":[["https://nekoeigo.net/tag/t2022","解説"]],"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E8%8B%B1%E8%AA%9E%E3%80%912022%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2023||main||世界史A":{"問題":[["https://www.toshin.com/kyotsutest/2023/sekaishi-a_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/answer_sekaishi-a.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/analysis_sekaishi-a.html","解説（設問別分析）"]]},
    "2023||main||世界史B":{"問題":[["https://www.toshin.com/kyotsutest/2023/sekaishi-b_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/answer_sekaishi-b.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/data/1675/sekaishi-b.pdf","解説"]]},
    "2023||main||倫理":{"問題":[["https://kyotsu.org/test/2023_%E5%80%AB%E7%90%86_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/answer_rinri.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/data/1669/rinri.pdf","解説"]]},
    "2023||main||倫理，政治・経済":{"問題":[["https://www.toshin.com/kyotsutest/2023/rinri_seikei_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/answer_rinri_seikei.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/data/1671/rinri-seikei.pdf","解説"]]},
    "2023||main||化学":{"問題":[["https://www.toshin.com/kyotsutest/2023/kagaku_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/answer_kagaku.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/data/1677/kagaku.pdf","解説"]]},
    "2023||main||化学基礎":{"問題":[["https://www.toshin.com/kyotsutest/2023/kagaku-kiso_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/answer_kagaku-kiso.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/data/1676/kagaku-kiso.pdf","解説"]]},
    "2023||main||国語":{"問題":[["https://www.toshin.com/kyotsutest/2023/kokugo_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/answer_kokugo.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/data/1667/kobunn.pdf","解説（古典）"],["https://www.toshin.com/kyotsutest/2023/data/1665/kokugo_gendai.pdf","解説（現代文）"]]},
    "2023||main||地学":{"問題":[["https://www.toshin.com/kyotsutest/2023/chigaku_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/answer_chigaku.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/data/1672/chigaku.pdf","解説"]]},
    "2023||main||地学基礎":{"問題":[["https://www.toshin.com/kyotsutest/2023/chigaku-kiso_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/answer_chigaku-kiso.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/data/1659/chigaku-kiso.pdf","解説"]]},
    "2023||main||地理A":{"問題":[["https://www.toshin.com/kyotsutest/2023/chiri-a_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/answer_chiri-a.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/analysis_chiri-a.html","解説（設問別分析）"]]},
    "2023||main||地理B":{"問題":[["https://kyotsu.org/test/2023_%E5%9C%B0%E7%90%86B_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/answer_chiri-b.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/data/1673/chiri-b.pdf","解説"]]},
    "2023||main||政治・経済":{"問題":[["https://www.toshin.com/kyotsutest/2023/s-keizai_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/answer_s-keizai.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/data/1668/s-keizai.pdf","解説"]]},
    "2023||main||数学Ⅰ":{"問題":[["https://www.toshin.com/kyotsutest/2023/suugaku-1_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/answer_suugaku-1.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/analysis_suugaku-1.html","解説（設問別分析）"]]},
    "2023||main||数学Ⅰ・数学A":{"問題":[["https://www.toshin.com/kyotsutest/2023/suugaku-1a_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/answer_suugaku-1a.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/data/1660/suugaku-1a.pdf","解説"]]},
    "2023||main||数学Ⅱ":{"問題":[["https://www.toshin.com/kyotsutest/2023/suugaku2_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/answer_suugaku2.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/analysis_suugaku2.html","解説（設問別分析）"]]},
    "2023||main||数学Ⅱ・数学B":{"問題":[["https://www.toshin.com/kyotsutest/2023/suugaku2b_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/answer_suugaku2b.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/data/1662/suugaku2b.pdf","解説"]]},
    "2023||main||日本史A":{"問題":[["https://www.toshin.com/kyotsutest/2023/nihonshi-a_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/answer_nihonshi-a.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/analysis_nihonshi-a.html","解説（設問別分析）"]]},
    "2023||main||日本史B":{"問題":[["https://www.toshin.com/kyotsutest/2023/nihonshi-b_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/answer_nihonshi-b.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/data/1674/nihonshi-b.pdf","解説"]]},
    "2023||main||物理":{"問題":[["https://kyotsu.org/test/2023_%E7%89%A9%E7%90%86_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/answer_butsuri.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/data/1664/butsuri.pdf","解説"]]},
    "2023||main||物理基礎":{"問題":[["https://www.toshin.com/kyotsutest/2023/butsuri-kiso_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/answer_butsuri-kiso.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/analysis_butsuri-kiso.html","解説（設問別分析）"]]},
    "2023||main||現代社会":{"問題":[["https://www.toshin.com/kyotsutest/2023/g-shakai_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/answer_g-shakai.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/data/1663/g-shakai.pdf","解説"]]},
    "2023||main||生物":{"問題":[["https://www.toshin.com/kyotsutest/2023/seibutsu_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/answer_seibutsu.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/data/1670/seibutsu.pdf","解説"]]},
    "2023||main||生物基礎":{"問題":[["https://kyotsu.org/test/2023_%E7%94%9F%E7%89%A9%E5%9F%BA%E7%A4%8E_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/answer_seibutsu-kiso.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/data/1658/seibutsu-kiso.pdf","解説"]]},
    "2023||main||英語（リスニング）":{"問題":[["https://www.toshin.com/kyotsutest/2023/listening_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/data/1373/listening_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/data/1661/listening.pdf","解説"]]},
    "2023||main||英語（リーディング）":{"問題":[["https://www.toshin.com/kyotsutest/2023/reading_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/data/1272/eigo_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/data/1656/eigo.pdf","解説"]]},
    "2023||retake||世界史A":{"解説":[["https://juken-library.com/?page_id=2660","解説"]]},
    "2023||retake||世界史B":{"解説":[["https://juken-library.com/?page_id=2660","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/albums/abm.php?d=508&f=abm00003383.pdf&n=R5_%E4%B8%96%E7%95%8C%E5%8F%B2B_%E8%BF%BD%E8%A9%A6%E9%A8%93%E3%81%AE%E6%AD%A3%E8%A7%A3.pdf","掲載ページ"]]},
    "2023||retake||倫理":{"解説":[["https://juken-library.com/?page_id=2660","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/albums/abm.php?d=508&f=abm00003390.pdf&n=R5_%E5%80%AB%E7%90%86_%E8%BF%BD%E8%A9%A6%E9%A8%93%E3%81%AE%E6%AD%A3%E8%A7%A3.pdf","掲載ページ"]]},
    "2023||retake||倫理，政治・経済":{"解説":[["https://juken-library.com/?page_id=2660","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/albums/abm.php?d=508&f=abm00003393.pdf&n=R5_%E5%80%AB%E7%90%86%E3%80%81%E6%94%BF%E6%B2%BB%E7%B5%8C%E6%B8%88_%E8%BF%BD%E8%A9%A6%E9%A8%93%E3%81%AE%E6%AD%A3%E8%A7%A3.pdf","掲載ページ"]]},
    "2023||retake||化学":{"解説":[["https://juken-library.com/?page_id=2660","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/albums/abm.php?d=508&f=abm00003420.pdf&n=R5_%E5%8C%96%E5%AD%A6_%E8%BF%BD%E8%A9%A6%E9%A8%93%E3%81%AE%E6%AD%A3%E8%A7%A3.pdf","掲載ページ"]]},
    "2023||retake||化学基礎":{"解説":[["https://juken-library.com/?page_id=2660","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/albums/abm.php?d=508&f=abm00003411.pdf&n=R5_%E5%8C%96%E5%AD%A6%E5%9F%BA%E7%A4%8E_%E8%BF%BD%E8%A9%A6%E9%A8%93%E3%81%AE%E6%AD%A3.pdf","掲載ページ"]]},
    "2023||retake||国語":{"解説":[["https://juken-library.com/?page_id=2660","解説"]]},
    "2023||retake||地学":{"解説":[["https://juken-library.com/?page_id=2660","解説"]]},
    "2023||retake||地学基礎":{"解説":[["https://juken-library.com/?page_id=2660","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/albums/abm.php?d=508&f=abm00003413.pdf&n=R5_%E5%9C%B0%E5%AD%A6%E5%9F%BA%E7%A4%8E_%E8%BF%BD%E8%A9%A6%E9%A8%93%E3%81%AE%E6%AD%A3%E8%A7%A3.pdf","掲載ページ"]]},
    "2023||retake||地理A":{"解説":[["https://juken-library.com/?page_id=2660","解説"]]},
    "2023||retake||地理B":{"解説":[["https://juken-library.com/?page_id=2660","解説"]]},
    "2023||retake||情報関係基礎":{"掲載ページ":[["https://www.kyotsutest.net/?recipe=%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E3%80%90%E6%83%85%E5%A0%B1%E3%80%912023%E5%B9%B4-%E8%BF%BD%E8%A9%A6%E3%80%80%E5%95%8F%E9%A1%8C%E8%A7%A3%E7%AD%94","掲載ページ"]]},
    "2023||retake||政治・経済":{"解説":[["https://juken-library.com/?page_id=2660","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/albums/abm.php?d=508&f=abm00003392.pdf&n=R5_%E6%94%BF%E6%B2%BB%E7%B5%8C%E6%B8%88_%E8%BF%BD%E8%A9%A6%E9%A8%93%E3%81%AE%E6%AD%A3%E8%A7%A3.pdf","掲載ページ"]]},
    "2023||retake||数学Ⅰ":{"解説":[["https://www.ozl.jp/dnk/2023tui/index.html","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/albums/abm.php?d=508&f=abm00003409.pdf&n=R5_%E6%95%B0%E5%AD%A6%E2%85%A0_%E8%BF%BD%E8%A9%A6%E9%A8%93%E3%81%AE%E6%AD%A3%E8%A7%A3.pdf","掲載ページ"]]},
    "2023||retake||数学Ⅰ・数学A":{"解説":[["https://www.ozl.jp/dnk/2023tui/index.html","解説"]]},
    "2023||retake||数学Ⅱ":{"解説":[["https://www.ozl.jp/dnk/2023tui/index.html","解説"]]},
    "2023||retake||数学Ⅱ・数学B":{"解説":[["https://www.ozl.jp/dnk/2023tui/index.html","解説"]]},
    "2023||retake||日本史A":{"解説":[["https://juken-library.com/?page_id=2660","解説"]]},
    "2023||retake||日本史B":{"解説":[["https://juken-library.com/?page_id=2660","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/albums/abm.php?d=508&f=abm00003388.pdf&n=R5_%E6%97%A5%E6%9C%AC%E5%8F%B2B_%E8%BF%BD%E8%A9%A6%E9%A8%93%E3%81%AE%E6%AD%A3%E8%A7%A3.pdf","掲載ページ"]]},
    "2023||retake||物理":{"解説":[["https://juken-library.com/?page_id=2660","解説"]]},
    "2023||retake||物理基礎":{"解説":[["https://juken-library.com/?page_id=2660","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/albums/abm.php?d=508&f=abm00003414.pdf&n=R5_%E7%89%A9%E7%90%86%E5%9F%BA%E7%A4%8E_%E8%BF%BD%E8%A9%A6%E9%A8%93%E3%81%AE%E6%AD%A3%E8%A7%A3.pdf","掲載ページ"]]},
    "2023||retake||現代社会":{"解説":[["https://juken-library.com/?page_id=2660","解説"]]},
    "2023||retake||生物":{"解説":[["https://juken-library.com/?page_id=2660","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/albums/abm.php?d=508&f=abm00003416.pdf&n=R5_%E7%94%9F%E7%89%A9_%E8%BF%BD%E8%A9%A6%E9%A8%93%E3%81%AE%E6%AD%A3%E8%A7%A3.pdf","掲載ページ"]]},
    "2023||retake||生物基礎":{"問題":[["https://kyotsu.org/test/2023_%E7%94%9F%E7%89%A9%E5%9F%BA%E7%A4%8E_%E8%BF%BD%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解説":[["https://juken-library.com/?page_id=2660","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/albums/abm.php?d=508&f=abm00003412.pdf&n=R5_%E7%94%9F%E7%89%A9%E5%9F%BA%E7%A4%8E_%E8%BF%BD%E8%A9%A6%E9%A8%93%E3%81%AE%E6%AD%A3%E8%A7%A3.pdf","掲載ページ"]]},
    "2023||retake||英語（リスニング）":{"解説":[["https://juken-library.com/?page_id=2660","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/albums/abm.php?d=508&f=abm00003397.pdf&n=R5_%E8%8B%B1%E8%AA%9E%E3%83%AA%E3%82%B9%E3%83%8B%E3%83%B3%E3%82%B0_%E8%BF%BD%E8%A9%A6%E9%A8%93%E3%81%AE%E6%AD%A3%E8%A7%A3.pdf","掲載ページ"]]},
    "2023||retake||英語（リーディング）":{"解説":[["https://juken-library.com/?page_id=2660","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/albums/abm.php?d=508&f=abm00003396.pdf&n=R5_%E8%8B%B1%E8%AA%9E%E3%83%AA%E3%83%BC%E3%83%87%E3%82%A3%E3%83%B3%E3%82%B0_%E8%BF%BD%E8%A9%A6%E9%A8%93%E3%81%AE%E6%AD%A3%E8%A7%A3.pdf","掲載ページ"]]},
    "2024||main||世界史A":{"問題":[["https://www.toshin.com/kyotsutest/2024/sekaishi-a_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2024/data/1854/sekaishi-a_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2024/analysis_sekaishi-a.html","解説（設問別分析）"]]},
    "2024||main||世界史B":{"問題":[["https://www.toshin.com/kyotsutest/2024/sekaishi-b_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2024/data/2257/sekaishi-b_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2024/data/2289/sekaishi-b.pdf","解説"]]},
    "2024||main||倫理":{"問題":[["https://www.toshin.com/kyotsutest/2024/rinri_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2024/data/1878/rinri_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2024/data/2291/rinri.pdf","解説"]]},
    "2024||main||倫理，政治・経済":{"問題":[["https://www.toshin.com/kyotsutest/2024/rinri_seikei_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2024/data/1939/rinri-seikei_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2024/data/2292/rinri_seikei.pdf","解説"]]},
    "2024||main||化学":{"問題":[["https://www.toshin.com/kyotsutest/2024/kagaku_question_0.html","問題"]],"解答":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r6/r6_honsiken_seikai.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2024/data/2298/kagaku.pdf","解説"]]},
    "2024||main||化学基礎":{"問題":[["https://www.toshin.com/kyotsutest/2024/kagaku-kiso_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2024/data/2256/kagaku-kiso_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2024/data/2293/kagaku-kiso.pdf","解説"]]},
    "2024||main||国語":{"問題":[["https://kyotsu.org/test/2024_%E5%9B%BD%E8%AA%9E_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2024/data/1889/kokugo_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2024/data/2286/kokugo_koten.pdf","解説（古典）"],["https://www.toshin.com/kyotsutest/2024/data/2287/kokugo_gendaibun.pdf","解説（現代文）"]]},
    "2024||main||地学":{"問題":[["https://www.toshin.com/kyotsutest/2024/chigaku_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2024/data/2188/chigaku_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2024/data/2285/chigaku.pdf","解説"]]},
    "2024||main||地学基礎":{"問題":[["https://www.toshin.com/kyotsutest/2024/chigaku-kiso_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2024/data/2072/chigaku-kiso_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2024/data/2284/chigaku-kiso.pdf","解説"]]},
    "2024||main||地理A":{"問題":[["https://www.toshin.com/kyotsutest/2024/chiri-a_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2024/data/1832/chiri-a_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2024/analysis_chiri-a.html","解説（設問別分析）"]]},
    "2024||main||地理B":{"問題":[["https://www.toshin.com/kyotsutest/2024/chiri-b_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2024/data/1830/chiri-b_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2024/data/2282/chiri-b.pdf","解説"]]},
    "2024||main||政治・経済":{"問題":[["https://kyotsu.org/test/2024_%E6%94%BF%E6%B2%BB%E7%B5%8C%E6%B8%88_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2024/data/1884/s-keizai_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2024/data/2290/s-keizai.pdf","解説"]]},
    "2024||main||数学Ⅰ":{"問題":[["https://www.toshin.com/kyotsutest/2024/suugaku-1_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2024/data/2162/sugaku-1_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2024/analysis_suugaku-1.html","解説（設問別分析）"]]},
    "2024||main||数学Ⅰ・数学A":{"問題":[["https://www.toshin.com/kyotsutest/2024/suugaku-1a_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2024/data/2161/sugaku-1a_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2024/data/2280/suugaku-1a.pdf","解説"]]},
    "2024||main||数学Ⅱ":{"問題":[["https://www.toshin.com/kyotsutest/2024/suugaku2_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2024/data/2273/sugaku-2_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2024/analysis_suugaku2.html","解説（設問別分析）"]]},
    "2024||main||数学Ⅱ・数学B":{"問題":[["https://www.toshin.com/kyotsutest/2024/suugaku2b_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/saiten/summary/2024_math_2B.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2024/data/2281/suugaku2b.pdf","解説"]]},
    "2024||main||日本史A":{"問題":[["https://www.toshin.com/kyotsutest/2024/nihonshi-a_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2024/data/1841/nihonshi-a_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2024/analysis_nihonshi-a.html","解説（設問別分析）"]]},
    "2024||main||日本史B":{"問題":[["https://www.toshin.com/kyotsutest/2024/nihonshi-b_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2024/data/1838/nihonshi-b_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2024/data/2283/nihonshi-b.pdf","解説"]]},
    "2024||main||物理":{"問題":[["https://kyotsu.org/test/2024_%E7%89%A9%E7%90%86_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r6/r6_honsiken_seikai.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2024/data/2296/butsuri.pdf","解説"]]},
    "2024||main||物理基礎":{"問題":[["https://www.toshin.com/kyotsutest/2024/butsuri-kiso_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2024/data/2253/butsuri-kiso_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2024/analysis_butsuri-kiso.html","解説（設問別分析）"]]},
    "2024||main||現代社会":{"問題":[["https://www.toshin.com/kyotsutest/2024/g-shakai_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2024/data/1879/g-shakai_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2024/data/2288/g-shakai.pdf","解説"]]},
    "2024||main||生物":{"問題":[["https://www.toshin.com/kyotsutest/2024/seibutsu_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2024/data/2239/seibutsu_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2024/data/2294/seibutsu.pdf","解説"]]},
    "2024||main||生物基礎":{"問題":[["https://www.toshin.com/kyotsutest/2024/seibutsu-kiso_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2024/data/2107/seibutsu-kiso_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2024/data/2295/seibutsu-kiso.pdf","解説"]]},
    "2024||main||英語（リスニング）":{"問題":[["https://kyotsu.org/test/2024_%E8%8B%B1%E8%AA%9EL_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2024/data/2268/listening_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2024/data/2279/listening.pdf","解説"]]},
    "2024||main||英語（リーディング）":{"問題":[["https://www.toshin.com/kyotsutest/2024/reading_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2024/data/2271/eigo_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2024/data/2278/reading.pdf","解説"]]},
    "2024||retake||世界史A":{"解説":[["https://juken-library.com/?page_id=1466","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r6/r6_tuisaisiken_seikai.html","掲載ページ"]]},
    "2024||retake||世界史B":{"解説":[["https://juken-library.com/?page_id=1466","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r6/r6_tuisaisiken_seikai.html","掲載ページ"]]},
    "2024||retake||倫理":{"解説":[["https://juken-library.com/?page_id=1466","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r6/r6_tuisaisiken_seikai.html","掲載ページ"]]},
    "2024||retake||倫理，政治・経済":{"解説":[["https://juken-library.com/?page_id=1466","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r6/r6_tuisaisiken_seikai.html","掲載ページ"]]},
    "2024||retake||化学":{"解説":[["https://juken-library.com/?page_id=1466","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r6/r6_tuisaisiken_seikai.html","掲載ページ"]]},
    "2024||retake||化学基礎":{"解説":[["https://juken-library.com/?page_id=1466","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r6/r6_tuisaisiken_seikai.html","掲載ページ"]]},
    "2024||retake||国語":{"解説":[["https://juken-library.com/?page_id=1466","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r6/r6_tuisaisiken_seikai.html","掲載ページ"]]},
    "2024||retake||地学":{"解説":[["https://juken-library.com/?page_id=1466","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r6/r6_tuisaisiken_seikai.html","掲載ページ"]]},
    "2024||retake||地学基礎":{"解説":[["https://juken-library.com/?page_id=1466","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r6/r6_tuisaisiken_seikai.html","掲載ページ"]]},
    "2024||retake||地理A":{"解説":[["https://juken-library.com/?page_id=1466","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r6/r6_tuisaisiken_seikai.html","掲載ページ"]]},
    "2024||retake||地理B":{"解説":[["https://juken-library.com/?page_id=1466","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r6/r6_tuisaisiken_seikai.html","掲載ページ"]]},
    "2024||retake||政治・経済":{"解説":[["https://juken-library.com/?page_id=1466","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r6/r6_tuisaisiken_seikai.html","掲載ページ"]]},
    "2024||retake||数学Ⅰ":{"解説":[["https://www.ozl.jp/dnk/2024tui/index.html","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/albums/abm.php?d=662&f=abm00004350.pdf&n=R6_%E6%95%B0%E5%AD%A6%E2%85%A0_%E8%BF%BD%E8%A9%A6%E9%A8%93%E3%81%AE%E6%AD%A3%E8%A7%A3.pdf","掲載ページ"]]},
    "2024||retake||数学Ⅰ・数学A":{"解説":[["https://www.ozl.jp/dnk/2024tui/index.html","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/albums/abm.php?d=662&f=abm00004351.pdf&n=R6_%E6%95%B0%E5%AD%A6%E2%85%A0A_%E8%BF%BD%E8%A9%A6%E9%A8%93%E3%81%AE%E6%AD%A3%E8%A7%A3.pdf","掲載ページ"]]},
    "2024||retake||数学Ⅱ":{"解説":[["https://www.ozl.jp/dnk/2024tui/index.html","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/albums/abm.php?d=662&f=abm00004358.pdf&n=R6_%E6%95%B0%E5%AD%A6%E2%85%A1_%E8%BF%BD%E8%A9%A6%E9%A8%93%E3%81%AE%E6%AD%A3%E8%A7%A3.pdf","掲載ページ"]]},
    "2024||retake||数学Ⅱ・数学B":{"問題":[["https://kyotsu.org/test/2024_%E6%95%B0%E5%AD%A6IIB_%E8%BF%BD%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解説":[["https://www.ozl.jp/dnk/2024tui/index.html","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/albums/abm.php?d=662&f=abm00004357.pdf&n=R6_%E6%95%B0%E5%AD%A6%E2%85%A1%EF%BC%A2_%E8%BF%BD%E8%A9%A6%E9%A8%93%E3%81%AE%E6%AD%A3%E8%A7%A3.pdf","掲載ページ"]]},
    "2024||retake||日本史A":{"解説":[["https://juken-library.com/?page_id=1466","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r6/r6_tuisaisiken_seikai.html","掲載ページ"]]},
    "2024||retake||日本史B":{"解説":[["https://juken-library.com/?page_id=1466","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r6/r6_tuisaisiken_seikai.html","掲載ページ"]]},
    "2024||retake||物理":{"解説":[["https://juken-library.com/?page_id=1466","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r6/r6_tuisaisiken_seikai.html","掲載ページ"]]},
    "2024||retake||物理基礎":{"解説":[["https://juken-library.com/?page_id=1466","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r6/r6_tuisaisiken_seikai.html","掲載ページ"]]},
    "2024||retake||現代社会":{"解説":[["https://juken-library.com/?page_id=1466","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r6/r6_tuisaisiken_seikai.html","掲載ページ"]]},
    "2024||retake||生物":{"解説":[["https://juken-library.com/?page_id=1466","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r6/r6_tuisaisiken_seikai.html","掲載ページ"]]},
    "2024||retake||生物基礎":{"解説":[["https://juken-library.com/?page_id=1466","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r6/r6_tuisaisiken_seikai.html","掲載ページ"]]},
    "2024||retake||英語（リスニング）":{"解説":[["https://juken-library.com/?page_id=1466","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r6/r6_tuisaisiken_seikai.html","掲載ページ"]]},
    "2024||retake||英語（リーディング）":{"解説":[["https://juken-library.com/?page_id=1466","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r6/r6_tuisaisiken_seikai.html","掲載ページ"]]},
    "2025||main||公共":{"問題":[["https://www.toshin.com/kyotsutest/2025/koukyou_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2025/data/2712/koukyou_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2025/data/3115/koukyo.pdf","解説"]]},
    "2025||main||公共，倫理":{"問題":[["https://kyotsu.org/test/2025_%E5%85%AC%E5%85%B1%E5%80%AB%E7%90%86_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2025/data/2713/koukyou-rinri_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2025/data/3121/koukyo-rinri.pdf","解説"]]},
    "2025||main||公共，政治・経済":{"問題":[["https://kyotsu.org/test/2025_%E5%85%AC%E5%85%B1%E6%94%BF%E6%B2%BB%E7%B5%8C%E6%B8%88_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2025/data/2711/koukyou-keizai_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2025/data/3122/koukyo-seikei.pdf","解説"]]},
    "2025||main||化学":{"問題":[["https://www.toshin.com/kyotsutest/2025/kagaku_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2025/answer_kagaku.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2025/data/3127/kagaku.pdf","解説"]]},
    "2025||main||化学基礎":{"問題":[["https://www.toshin.com/kyotsutest/2025/kagaku-kiso_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2025/data/2950/kagaku-kiso_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2025/data/3129/kagakukiso.pdf","解説"]]},
    "2025||main||国語":{"問題":[["https://www.toshin.com/kyotsutest/2025/kokugo_question_0.html","問題"]],"解答":[["https://www-cdn.keinet.ne.jp/center/dl/09_kokugo.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2025/data/3120/koten.pdf","解説（古典）"],["https://www.toshin.com/kyotsutest/2025/data/3118/gendaibun.pdf","解説（現代文）"]]},
    "2025||main||地学":{"問題":[["https://www.toshin.com/kyotsutest/2025/chigaku_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2025/data/2953/chigaku_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2025/data/3126/chigaku.pdf","解説"]]},
    "2025||main||地学基礎":{"問題":[["https://www.toshin.com/kyotsutest/2025/chigaku-kiso_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2025/data/2952/chigaku-kiso_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2025/data/3124/chigakukiso.pdf","解説"]]},
    "2025||main||地理総合":{"問題":[["https://www.toshin.com/kyotsutest/2025/tiri_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2025/data/2697/tiri_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2025/data/3132/tirisougou.pdf","解説"]]},
    "2025||main||地理総合，地理探究":{"問題":[["https://kyotsu.org/test/2025_%E5%9C%B0%E7%90%86%E7%B7%8F%E5%90%88%E5%9C%B0%E7%90%86%E6%8E%A2%E7%A9%B6_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2025/data/2705/tiri-sougou_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2025/data/3130/tiri-tankyu.pdf","解説"]]},
    "2025||main||情報Ⅰ":{"問題":[["https://www.toshin.com/kyotsutest/2025/jouhou1_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2025/answer_jouhou1.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2025/data/3117/jouhou-1.pdf","解説"]]},
    "2025||main||数学Ⅰ":{"問題":[["https://www.toshin.com/kyotsutest/2025/suugaku-1_question_0.html","問題"]],"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=740&f=abm00005169.pdf&n=R7_%E3%80%90%E6%95%B0%E5%AD%A6%E2%85%A0%E3%80%91%E6%9C%AC%E8%A9%A6%E9%A8%93%E3%81%AE%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2025/analysis_suugaku-1.html","解説（設問別分析）"]]},
    "2025||main||数学Ⅰ，数学A":{"問題":[["https://www.toshin.com/kyotsutest/2025/suugaku-1a_question_0.html","問題"]],"解答":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r7/r7_honsiken_seikai.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2025/data/3133/suugaku-1A.pdf","解説"]]},
    "2025||main||数学Ⅱ，数学B，数学C":{"問題":[["https://www.toshin.com/kyotsutest/2025/suugaku2bc_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2025/data/3018/suugaku2bc_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2025/data/3112/suugaku-2bc.pdf","解説"]]},
    "2025||main||旧世界史A":{"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=740&f=abm00005146.pdf&n=R7_%E3%80%90%E6%97%A7%E4%B8%96%E7%95%8C%E5%8F%B2A%E3%80%91%E6%9C%AC%E8%A9%A6%E9%A8%93%E3%81%AE%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://juken-library.com/kyotsu-2025-honshiken-sekaishi-a-kaisetsu/","解説"]]},
    "2025||main||旧世界史B":{"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=740&f=abm00005147.pdf&n=R7_%E3%80%90%E6%97%A7%E4%B8%96%E7%95%8C%E5%8F%B2B%E3%80%91%E6%9C%AC%E8%A9%A6%E9%A8%93%E3%81%AE%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://juken-library.com/kyotsu-2025-honshiken-sekaishi-b-kaisetsu/","解説"]]},
    "2025||main||旧倫理":{"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=740&f=abm00005142.pdf&n=R7_%E3%80%90%E6%97%A7%E5%80%AB%E7%90%86%E3%80%91%E6%9C%AC%E8%A9%A6%E9%A8%93%E3%81%AE%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://juken-library.com/kyotsu-2025-honshiken-rinri-kaisetsu/","解説"]]},
    "2025||main||旧倫理，旧政治・経済":{"問題":[["https://kyotsu.org/test/2025_%E6%97%A7%E5%80%AB%E7%90%86%E6%97%A7%E6%94%BF%E6%B2%BB%E7%B5%8C%E6%B8%88_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=740&f=abm00005139.pdf&n=R7_%E3%80%90%E6%97%A7%E5%80%AB%E7%90%86%EF%BC%8C%E6%97%A7%E6%94%BF%E6%B2%BB%E3%83%BB%E7%B5%8C%E6%B8%88%E3%80%91%E6%9C%AC%E8%A9%A6%E9%A8%93%E3%81%AE%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://juken-library.com/kyotsu-2025-honshiken-rinri-seiji-keizai-kaisetsu/","解説"]]},
    "2025||main||旧地理A":{"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=740&f=abm00005143.pdf&n=R7_%E3%80%90%E6%97%A7%E5%9C%B0%E7%90%86A%E3%80%91%E6%9C%AC%E8%A9%A6%E9%A8%93%E3%81%AE%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://juken-library.com/kyotsu-2025-honshiken-chiri-a-kaisetsu/","解説"]]},
    "2025||main||旧地理B":{"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=740&f=abm00005138.pdf&n=R7_%E3%80%90%E6%97%A7%E5%9C%B0%E7%90%86B%E3%80%91%E6%9C%AC%E8%A9%A6%E9%A8%93%E3%81%AE%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://juken-library.com/kyotsu-2025-honshiken-chiri-b-kaisetsu/","解説"]]},
    "2025||main||旧情報":{"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=740&f=abm00005171.pdf&n=R7_%E3%80%90%E6%97%A7%E6%83%85%E5%A0%B1%E3%80%91%E6%9C%AC%E8%A9%A6%E9%A8%93%E3%81%AE%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://juken-library.com/?page_id=2788","解説"]]},
    "2025||main||旧政治・経済":{"解説":[["https://juken-library.com/kyotsu-2025-honshiken-seiji-keizai-kaisetsu/","解説"]]},
    "2025||main||旧数学Ⅰ":{},
    "2025||main||旧数学Ⅰ・旧数学A":{"問題":[["https://kyotsu.org/test/2025_%E6%97%A7%E6%95%B0%E5%AD%A6IA_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=740&f=abm00005168.pdf&n=R7_%E3%80%90%E6%97%A7%E6%95%B0%E5%AD%A6%E2%85%A0%E3%83%BB%E6%97%A7%E6%95%B0%E5%AD%A6A%E3%80%91%E6%9C%AC%E8%A9%A6%E9%A8%93%E3%81%AE%E6%AD%A3%E8%A7%A3.pdf","解答"]]},
    "2025||main||旧数学Ⅱ":{"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=740&f=abm00005174.pdf&n=R7_%E3%80%90%E6%97%A7%E6%95%B0%E5%AD%A6%E2%85%A1%E3%80%91%E6%9C%AC%E8%A9%A6%E9%A8%93%E3%81%AE%E6%AD%A3%E8%A7%A3.pdf","解答"]]},
    "2025||main||旧数学Ⅱ・旧数学B":{"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=740&f=abm00005175.pdf&n=R7_%E3%80%90%E6%97%A7%E6%95%B0%E5%AD%A6%E2%85%A1%E3%83%BB%E6%97%A7%E6%95%B0%E5%AD%A6B%E3%80%91%E6%9C%AC%E8%A9%A6%E9%A8%93%E3%81%AE%E6%AD%A3%E8%A7%A3.pdf","解答"]]},
    "2025||main||旧日本史A":{"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=740&f=abm00005145.pdf&n=R7_%E3%80%90%E6%97%A7%E6%97%A5%E6%9C%AC%E5%8F%B2A%E3%80%91%E6%9C%AC%E8%A9%A6%E9%A8%93%E3%81%AE%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://juken-library.com/kyotsu-2025-honshiken-nihonshi-a-kaisetsu/","解説"]]},
    "2025||main||旧日本史B":{"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=740&f=abm00005144.pdf&n=R7_%E3%80%90%E6%97%A7%E6%97%A5%E6%9C%AC%E5%8F%B2B%E3%80%91%E6%9C%AC%E8%A9%A6%E9%A8%93%E3%81%AE%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://juken-library.com/kyotsu-2025-honshiken-nihonshi-b-kaisetsu/","解説"]]},
    "2025||main||旧現代社会":{"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=740&f=abm00005140.pdf&n=R7_%E3%80%90%E6%97%A7%E7%8F%BE%E4%BB%A3%E7%A4%BE%E4%BC%9A%E3%80%91%E6%9C%AC%E8%A9%A6%E9%A8%93%E3%81%AE%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://juken-library.com/kyotsu-2025-honshiken-gendai-shakai-kaisetsu/","解説"]]},
    "2025||main||歴史総合":{"問題":[["https://www.toshin.com/kyotsutest/2025/rekishi_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2025/data/2717/rekishi_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2025/data/3134/rekishisougou.pdf","解説"]]},
    "2025||main||歴史総合，世界史探究":{"問題":[["https://www.toshin.com/kyotsutest/2025/rekishi-sekaishi_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2025/data/2716/rekishi-sekaishi_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2025/data/3116/sekaishi-tankyu.pdf","解説"]]},
    "2025||main||歴史総合，日本史探究":{"問題":[["https://kyotsu.org/test/2025_%E6%AD%B4%E5%8F%B2%E7%B7%8F%E5%90%88%E6%97%A5%E6%9C%AC%E5%8F%B2%E6%8E%A2%E7%A9%B6_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2025/data/2726/rekishi-nihonshi_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2025/data/3123/nihonshi-tankyu.pdf","解説"]]},
    "2025||main||物理":{"問題":[["https://kyotsu.org/test/2025_%E7%89%A9%E7%90%86_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r7/r7_honsiken_seikai.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2025/data/3119/butsuri.pdf","解説"]]},
    "2025||main||物理基礎":{"問題":[["https://kyotsu.org/test/2025_%E7%89%A9%E7%90%86%E5%9F%BA%E7%A4%8E_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2025/data/2947/butsuri-kiso_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2025/data/3114/butsurikiso.pdf","解説"]]},
    "2025||main||生物":{"問題":[["https://kyotsu.org/test/2025_%E7%94%9F%E7%89%A9_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www-cdn.keinet.ne.jp/center/dl/18_seibutsu.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2025/analysis_seibutsu.html","解説（設問別分析）"]]},
    "2025||main||生物基礎":{"問題":[["https://kyotsu.org/test/2025_%E7%94%9F%E7%89%A9%E5%9F%BA%E7%A4%8E_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2025/data/2948/seibutsu-kiso_ans.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2025/data/3125/seibutsukiso.pdf","解説"]]},
    "2025||main||英語（リスニング）":{"問題":[["https://www.toshin.com/kyotsutest/2025/listening_question_0.html","問題"]],"解答":[["https://www-cdn.keinet.ne.jp/center/dl/11_listening.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2025/data/3131/listening.pdf","解説"]]},
    "2025||main||英語（リーディング）":{"問題":[["https://www.toshin.com/kyotsutest/2025/reading_question_0.html","問題"]],"解答":[["https://www-cdn.keinet.ne.jp/center/dl/10_reading.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2025/data/3113/reading.pdf","解説"]]},
    "2025||retake||公共":{"解説":[["https://juken-library.com/?page_id=3768","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r7/r7_tuisaisiken_seikai.html","掲載ページ"]]},
    "2025||retake||公共，倫理":{"解説":[["https://juken-library.com/?page_id=3768","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r7/r7_tuisaisiken_seikai.html","掲載ページ"]]},
    "2025||retake||公共，政治・経済":{"解説":[["https://juken-library.com/?page_id=3768","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r7/r7_tuisaisiken_seikai.html","掲載ページ"]]},
    "2025||retake||化学":{"解説":[["https://juken-library.com/?page_id=3768","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r7/r7_tuisaisiken_seikai.html","掲載ページ"]]},
    "2025||retake||化学基礎":{"解説":[["https://juken-library.com/?page_id=3768","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r7/r7_tuisaisiken_seikai.html","掲載ページ"]]},
    "2025||retake||国語":{"解説":[["https://juken-library.com/?page_id=3768","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r7/r7_tuisaisiken_seikai.html","掲載ページ"]]},
    "2025||retake||地学":{"解説":[["https://juken-library.com/?page_id=3768","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r7/r7_tuisaisiken_seikai.html","掲載ページ"]]},
    "2025||retake||地学基礎":{"解説":[["https://juken-library.com/?page_id=3768","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r7/r7_tuisaisiken_seikai.html","掲載ページ"]]},
    "2025||retake||地理総合":{"解説":[["https://juken-library.com/?page_id=3768","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r7/r7_tuisaisiken_seikai.html","掲載ページ"]]},
    "2025||retake||地理総合，地理探究":{"解説":[["https://juken-library.com/?page_id=3768","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r7/r7_tuisaisiken_seikai.html","掲載ページ"]]},
    "2025||retake||情報Ⅰ":{"問題":[["https://kyotsu.org/test/2025_%E6%83%85%E5%A0%B1I_%E8%BF%BD%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解説":[["https://juken-library.com/?page_id=3768","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r7/r7_tuisaisiken_seikai.html","掲載ページ"]]},
    "2025||retake||数学Ⅰ":{"解説":[["https://www.ozl.jp/dnk/2025tui/index.html","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r7/r7_tuisaisiken_seikai.html","掲載ページ"]]},
    "2025||retake||数学Ⅰ，数学A":{"解説":[["https://www.ozl.jp/dnk/2025tui/index.html","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r7/r7_tuisaisiken_seikai.html","掲載ページ"]]},
    "2025||retake||数学Ⅱ，数学B，数学C":{"解説":[["https://www.ozl.jp/dnk/2025tui/index.html","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r7/r7_tuisaisiken_seikai.html","掲載ページ"]]},
    "2025||retake||旧世界史A":{"掲載ページ":[["https://www.dnc.ac.jp/albums/abm.php?d=741&f=abm00005229.pdf&n=R7%E8%BF%BD%E5%86%8D_%E3%80%90%E6%97%A7%E4%B8%96%E7%95%8C%E5%8F%B2A%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","掲載ページ"]]},
    "2025||retake||旧世界史B":{"問題":[["https://kyotsu.org/test/2025_%E6%97%A7%E4%B8%96%E7%95%8C%E5%8F%B2B_%E8%BF%BD%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"掲載ページ":[["https://www.dnc.ac.jp/albums/abm.php?d=741&f=abm00005228.pdf&n=R7%E8%BF%BD%E5%86%8D_%E3%80%90%E6%97%A7%E4%B8%96%E7%95%8C%E5%8F%B2B%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","掲載ページ"]]},
    "2025||retake||旧倫理":{"掲載ページ":[["https://www.dnc.ac.jp/albums/abm.php?d=741&f=abm00005215.pdf&n=R7%E8%BF%BD%E5%86%8D_%E3%80%90%E6%97%A7%E5%80%AB%E7%90%86%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","掲載ページ"]]},
    "2025||retake||旧倫理，旧政治・経済":{"掲載ページ":[["https://www.dnc.ac.jp/albums/abm.php?d=741&f=abm00005216.pdf&n=R7%E8%BF%BD%E5%86%8D_%E3%80%90%E6%97%A7%E5%80%AB%E7%90%86%EF%BC%8C%E6%97%A7%E6%94%BF%E6%B2%BB%E3%83%BB%E7%B5%8C%E6%B8%88%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","掲載ページ"]]},
    "2025||retake||旧地理A":{"掲載ページ":[["https://www.dnc.ac.jp/albums/abm.php?d=741&f=abm00005213.pdf&n=R7%E8%BF%BD%E5%86%8D_%E3%80%90%E6%97%A7%E5%9C%B0%E7%90%86A%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","掲載ページ"]]},
    "2025||retake||旧地理B":{"掲載ページ":[["https://www.dnc.ac.jp/albums/abm.php?d=741&f=abm00005214.pdf&n=R7%E8%BF%BD%E5%86%8D_%E3%80%90%E6%97%A7%E5%9C%B0%E7%90%86B%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","掲載ページ"]]},
    "2025||retake||旧情報":{"掲載ページ":[["https://www.dnc.ac.jp/albums/abm.php?d=741&f=abm00005249.pdf&n=R7%E8%BF%BD%E5%86%8D%E3%80%90%E6%97%A7%E6%83%85%E5%A0%B1%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","掲載ページ"]]},
    "2025||retake||旧政治・経済":{"掲載ページ":[["https://www.dnc.ac.jp/albums/abm.php?d=741&f=abm00005220.pdf&n=R7%E8%BF%BD%E5%86%8D_%E3%80%90%E6%97%A7%E6%94%BF%E6%B2%BB%E3%83%BB%E7%B5%8C%E6%B8%88%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","掲載ページ"]]},
    "2025||retake||旧数学Ⅰ":{"掲載ページ":[["https://www.dnc.ac.jp/albums/abm.php?d=741&f=abm00005242.pdf&n=R7%E8%BF%BD%E5%86%8D%E3%80%90%E6%97%A7%E6%95%B0%E5%AD%A6%E2%85%A0%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","掲載ページ"]]},
    "2025||retake||旧数学Ⅰ・旧数学A":{"掲載ページ":[["https://www.dnc.ac.jp/albums/abm.php?d=741&f=abm00005239.pdf&n=R7%E8%BF%BD%E5%86%8D%E3%80%90%E6%97%A7%E6%95%B0%E5%AD%A6%E2%85%A0%E3%83%BB%E6%97%A7%E6%95%B0%E5%AD%A6A%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","掲載ページ"]]},
    "2025||retake||旧数学Ⅱ":{"掲載ページ":[["https://www.dnc.ac.jp/albums/abm.php?d=741&f=abm00005251.pdf&n=R7%E8%BF%BD%E5%86%8D%E3%80%90%E6%97%A7%E6%95%B0%E5%AD%A6%E2%85%A1%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","掲載ページ"]]},
    "2025||retake||旧数学Ⅱ・旧数学B":{"掲載ページ":[["https://www.dnc.ac.jp/albums/abm.php?d=741&f=abm00005252.pdf&n=R7%E8%BF%BD%E5%86%8D%E3%80%90%E6%97%A7%E6%95%B0%E5%AD%A6%E2%85%A1%E3%83%BB%E6%97%A7%E6%95%B0%E5%AD%A6B%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","掲載ページ"]]},
    "2025||retake||旧日本史A":{"掲載ページ":[["https://www.dnc.ac.jp/albums/abm.php?d=741&f=abm00005226.pdf&n=R7%E8%BF%BD%E5%86%8D_%E3%80%90%E6%97%A7%E6%97%A5%E6%9C%AC%E5%8F%B2A%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","掲載ページ"]]},
    "2025||retake||旧日本史B":{"掲載ページ":[["https://www.dnc.ac.jp/albums/abm.php?d=741&f=abm00005227.pdf&n=R7%E8%BF%BD%E5%86%8D_%E3%80%90%E6%97%A7%E6%97%A5%E6%9C%AC%E5%8F%B2B%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","掲載ページ"]]},
    "2025||retake||旧現代社会":{"掲載ページ":[["https://www.dnc.ac.jp/albums/abm.php?d=741&f=abm00005217.pdf&n=R7%E8%BF%BD%E5%86%8D_%E3%80%90%E6%97%A7%E7%8F%BE%E4%BB%A3%E7%A4%BE%E4%BC%9A%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","掲載ページ"]]},
    "2025||retake||歴史総合":{"解説":[["https://juken-library.com/?page_id=3768","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r7/r7_tuisaisiken_seikai.html","掲載ページ"]]},
    "2025||retake||歴史総合，世界史探究":{"問題":[["https://kyotsu.org/test/2025_%E6%AD%B4%E5%8F%B2%E7%B7%8F%E5%90%88%E4%B8%96%E7%95%8C%E5%8F%B2%E6%8E%A2%E7%A9%B6_%E8%BF%BD%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解説":[["https://juken-library.com/?page_id=3768","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r7/r7_tuisaisiken_seikai.html","掲載ページ"]]},
    "2025||retake||歴史総合，日本史探究":{"解説":[["https://juken-library.com/?page_id=3768","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r7/r7_tuisaisiken_seikai.html","掲載ページ"]]},
    "2025||retake||物理":{"解説":[["https://juken-library.com/?page_id=3768","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r7/r7_tuisaisiken_seikai.html","掲載ページ"]]},
    "2025||retake||物理基礎":{"解説":[["https://juken-library.com/?page_id=3768","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r7/r7_tuisaisiken_seikai.html","掲載ページ"]]},
    "2025||retake||生物":{"問題":[["https://kyotsu.org/test/2025_%E7%94%9F%E7%89%A9_%E8%BF%BD%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解説":[["https://juken-library.com/?page_id=3768","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r7/r7_tuisaisiken_seikai.html","掲載ページ"]]},
    "2025||retake||生物基礎":{"問題":[["https://kyotsu.org/test/2025_%E7%94%9F%E7%89%A9%E5%9F%BA%E7%A4%8E_%E8%BF%BD%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解説":[["https://juken-library.com/?page_id=3768","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r7/r7_tuisaisiken_seikai.html","掲載ページ"]]},
    "2025||retake||英語（リスニング）":{"問題":[["https://kyotsu.org/test/2025_%E8%8B%B1%E8%AA%9EL_%E8%BF%BD%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解説":[["https://juken-library.com/?page_id=3768","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r7/r7_tuisaisiken_seikai.html","掲載ページ"]]},
    "2025||retake||英語（リーディング）":{"解説":[["https://juken-library.com/?page_id=3768","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r7/r7_tuisaisiken_seikai.html","掲載ページ"]]},
    "2025||other||試作問題 公共，倫理":{"問題":[["https://www.dnc.ac.jp/albums/abm.php?d=744&f=abm00003144.pdf&n=3-2-1_%E8%A9%A6%E4%BD%9C%E5%95%8F%E9%A1%8C%E3%80%8E%E5%85%AC%E5%85%B1%EF%BC%8C%E5%80%AB%E7%90%86%E3%80%8F.pdf","問題"]]},
    "2025||other||試作問題 公共，政治・経済":{"問題":[["https://www.dnc.ac.jp/albums/abm.php?d=744&f=abm00003143.pdf&n=3-2-2_%E8%A9%A6%E4%BD%9C%E5%95%8F%E9%A1%8C%E3%80%8E%E5%85%AC%E5%85%B1%EF%BC%8C%E6%94%BF%E6%B2%BB%E3%83%BB%E7%B5%8C%E6%B8%88%E3%80%8F.pdf","問題"]]},
    "2025||other||試作問題 国語":{"問題":[["https://www.dnc.ac.jp/albums/abm.php?d=744&f=abm00003142.pdf&n=1-2_%E8%A9%A6%E4%BD%9C%E5%95%8F%E9%A1%8C%E3%80%8E%E5%9B%BD%E8%AA%9E%E3%80%8F.pdf","問題"]]},
    "2025||other||試作問題 地理総合，地理探究":{"問題":[["https://www.dnc.ac.jp/albums/abm.php?d=744&f=abm00003145.pdf&n=2-2-1_%E8%A9%A6%E4%BD%9C%E5%95%8F%E9%A1%8C%E3%80%8E%E5%9C%B0%E7%90%86%E7%B7%8F%E5%90%88%EF%BC%8C%E5%9C%B0%E7%90%86%E6%8E%A2%E7%A9%B6%E3%80%8F.pdf","問題"]]},
    "2025||other||試作問題 地理総合，歴史総合，公共":{},
    "2025||other||試作問題 情報Ⅰ":{"問題":[["https://www.dnc.ac.jp/albums/abm.php?d=744&f=abm00003277.pdf&n=6-2-1_%E8%A9%A6%E4%BD%9C%E5%95%8F%E9%A1%8C%E3%80%8E%E6%83%85%E5%A0%B1%E2%85%A0%E3%80%8F%E2%80%BB%E4%BB%A4%E5%92%8C4%E5%B9%B412%E6%9C%8823%E6%97%A5%E4%B8%80%E9%83%A8%E4%BF%AE%E6%AD%A3.pdf","問題"]]},
    "2025||other||試作問題 情報Ⅰ（参考問題）":{"問題":[["https://www.dnc.ac.jp/albums/abm.php?d=744&f=abm00003154.pdf&n=6-2-2_%E8%A9%A6%E4%BD%9C%E5%95%8F%E9%A1%8C%E3%80%8E%E6%83%85%E5%A0%B1%E2%85%A0%E3%80%8F%EF%BC%88%E5%8F%82%E8%80%83%E5%95%8F%E9%A1%8C%EF%BC%89.pdf","問題"]]},
    "2025||other||試作問題 数学ⅠA":{"問題":[["https://www.dnc.ac.jp/albums/abm.php?d=744&f=abm00003151.pdf&n=4-2-1_%E8%A9%A6%E4%BD%9C%E5%95%8F%E9%A1%8C%E3%80%8E%E6%95%B0%E5%AD%A6%E2%85%A0%EF%BC%8C%E6%95%B0%E5%AD%A6A%E3%80%8F.pdf","問題"]]},
    "2025||other||試作問題 数学ⅡBC":{"問題":[["https://www.dnc.ac.jp/albums/abm.php?d=744&f=abm00003156.pdf&n=4-2-2_%E8%A9%A6%E4%BD%9C%E5%95%8F%E9%A1%8C%E3%80%8E%E6%95%B0%E5%AD%A6%E2%85%A1%EF%BC%8C%E6%95%B0%E5%AD%A6B%EF%BC%8C%E6%95%B0%E5%AD%A6C%E3%80%8F.pdf","問題"]]},
    "2025||other||試作問題 旧情報（仮）":{"問題":[["https://www.dnc.ac.jp/albums/abm.php?d=744&f=abm00003278.pdf&n=6-2-3_%E8%A9%A6%E4%BD%9C%E5%95%8F%E9%A1%8C%E3%80%8E%E6%97%A7%E6%83%85%E5%A0%B1%EF%BC%88%E4%BB%AE%EF%BC%89%E3%80%8F%E2%80%BB%E4%BB%A4%E5%92%8C4%E5%B9%B412%E6%9C%8823%E6%97%A5%E4%B8%80%E9%83%A8%E4%BF%AE%E6%AD%A3.pdf","問題"]]},
    "2025||other||試作問題 歴史総合，世界史探究":{"問題":[["https://www.dnc.ac.jp/albums/abm.php?d=744&f=abm00003146.pdf&n=2-2-3_%E8%A9%A6%E4%BD%9C%E5%95%8F%E9%A1%8C%E3%80%8E%E6%AD%B4%E5%8F%B2%E7%B7%8F%E5%90%88%EF%BC%8C%E4%B8%96%E7%95%8C%E5%8F%B2%E6%8E%A2%E7%A9%B6%E3%80%8F.pdf","問題"]]},
    "2025||other||試作問題 歴史総合，日本史探究":{"問題":[["https://www.dnc.ac.jp/albums/abm.php?d=744&f=abm00003199.pdf&n=2-2-2_%E8%A9%A6%E4%BD%9C%E5%95%8F%E9%A1%8C%E3%80%8E%E6%AD%B4%E5%8F%B2%E7%B7%8F%E5%90%88%EF%BC%8C%E6%97%A5%E6%9C%AC%E5%8F%B2%E6%8E%A2%E7%A9%B6%E3%80%8F.pdf","問題"]]},
    "2025||other||試作問題 英語L":{"問題":[["https://www.dnc.ac.jp/albums/abm.php?d=744&f=abm00003150.pdf&n=5-2-2_%E8%A9%A6%E4%BD%9C%E5%95%8F%E9%A1%8C%E3%80%8E%E8%8B%B1%E8%AA%9E%EF%BC%88%E3%83%AA%E3%82%B9%E3%83%8B%E3%83%B3%E3%82%B0%EF%BC%89%E3%80%8F.pdf","問題"]]},
    "2025||other||試作問題 英語R":{"問題":[["https://www.dnc.ac.jp/albums/abm.php?d=744&f=abm00003152.pdf&n=5-2-1_%E8%A9%A6%E4%BD%9C%E5%95%8F%E9%A1%8C%E3%80%8E%E8%8B%B1%E8%AA%9E%EF%BC%88%E3%83%AA%E3%83%BC%E3%83%87%E3%82%A3%E3%83%B3%E3%82%B0%EF%BC%89%E3%80%8F.pdf","問題"]]},
    "2026||main||公共":{"問題":[["https://www.toshin.com/kyotsutest/koukyou_question_0.html","問題"]],"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=797&f=abm00006029.pdf&n=R8_%E3%80%90%E5%9C%B0%E7%B7%8F%EF%BC%8F%E6%AD%B4%E7%B7%8F%EF%BC%8F%E5%85%AC%E5%85%B1%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/data/3750/koukyo.pdf","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_honsiken_seikai.html","掲載ページ"]]},
    "2026||main||公共，倫理":{"問題":[["https://kyotsu.org/test/2026_%E5%85%AC%E5%85%B1%E5%80%AB%E7%90%86_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=797&f=abm00006030.pdf&n=R8_%E3%80%90%E5%85%AC%E5%85%B1%EF%BC%8C%E5%80%AB%E7%90%86%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/data/3743/koukyo-rinri.pdf","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_honsiken_seikai.html","掲載ページ"]]},
    "2026||main||公共，政治・経済":{"問題":[["https://www.toshin.com/kyotsutest/koukyou-keizai_question_0.html","問題"]],"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=797&f=abm00006034.pdf&n=R8_%E3%80%90%E5%85%AC%E5%85%B1%EF%BC%8C%E6%94%BF%E6%B2%BB%E7%B5%8C%E6%B8%88%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/data/3745/koukyo-seikei.pdf","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_honsiken_seikai.html","掲載ページ"]]},
    "2026||main||化学":{"問題":[["https://www.toshin.com/kyotsutest/kagaku_question_0.html","問題"]],"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=797&f=abm00006050.pdf&n=R8_%E3%80%90%E5%8C%96%E5%AD%A6%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/data/3747/kagaku.pdf","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_honsiken_seikai.html","掲載ページ"]]},
    "2026||main||化学基礎":{"問題":[["https://www.toshin.com/kyotsutest/kagaku-kiso_question_0.html","問題"]],"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=797&f=abm00006051.pdf&n=R8_%E3%80%90%E5%9F%BA%E7%A4%8E%E7%A7%91%E7%9B%AE%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/data/3744/kagaku-kiso.pdf","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_honsiken_seikai.html","掲載ページ"]]},
    "2026||main||国語":{"問題":[["https://www.toshin.com/kyotsutest/kokugo_question_0.html","問題"]],"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=797&f=abm00006035.pdf&n=R8_%E3%80%90%E5%9B%BD%E8%AA%9E%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/data/3754/koten.pdf","解説（古典）"],["https://www.toshin.com/kyotsutest/analysis_kokugo.html","解説（設問別分析）"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_honsiken_seikai.html","掲載ページ"]]},
    "2026||main||地学":{"問題":[["https://www.toshin.com/kyotsutest/chigaku_question_0.html","問題"]],"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=797&f=abm00006048.pdf&n=R8_%E3%80%90%E5%9C%B0%E5%AD%A6%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/data/3751/tigaku.pdf","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_honsiken_seikai.html","掲載ページ"]]},
    "2026||main||地学基礎":{"問題":[["https://www.toshin.com/kyotsutest/chigaku-kiso_question_0.html","問題"]],"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=797&f=abm00006051.pdf&n=R8_%E3%80%90%E5%9F%BA%E7%A4%8E%E7%A7%91%E7%9B%AE%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/data/3749/tigaku-kiso.pdf","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_honsiken_seikai.html","掲載ページ"]]},
    "2026||main||地理総合":{"問題":[["https://www.toshin.com/kyotsutest/tiri_question_0.html","問題"]],"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=797&f=abm00006029.pdf&n=R8_%E3%80%90%E5%9C%B0%E7%B7%8F%EF%BC%8F%E6%AD%B4%E7%B7%8F%EF%BC%8F%E5%85%AC%E5%85%B1%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/data/3746/tirisougou.pdf","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_honsiken_seikai.html","掲載ページ"]]},
    "2026||main||地理総合，地理探究":{"問題":[["https://kyotsu.org/test/2026_%E5%9C%B0%E7%90%86%E7%B7%8F%E5%90%88%E5%9C%B0%E7%90%86%E6%8E%A2%E7%A9%B6_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=797&f=abm00006031.pdf&n=R8_%E3%80%90%E5%9C%B0%E7%90%86%E7%B7%8F%E5%90%88%EF%BC%8C%E5%9C%B0%E7%90%86%E6%8E%A2%E7%A9%B6%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/data/3740/tiri-tankyu.pdf","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_honsiken_seikai.html","掲載ページ"]]},
    "2026||main||情報Ⅰ":{"問題":[["https://www.toshin.com/kyotsutest/jouhou1_question_0.html","問題"]],"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=797&f=abm00006055.pdf&n=R8_%E3%80%90%E6%83%85%E5%A0%B1%E2%85%A0%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/data/3763/jouhou-1.pdf","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_honsiken_seikai.html","掲載ページ"]]},
    "2026||main||数学Ⅰ":{"問題":[["https://www.toshin.com/kyotsutest/suugaku-1_question_0.html","問題"]],"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=797&f=abm00006053.pdf&n=R8_%E3%80%90%E6%95%B0%E5%AD%A6%E2%85%A0%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/analysis_suugaku-1.html","解説（設問別分析）"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_honsiken_seikai.html","掲載ページ"]]},
    "2026||main||数学Ⅰ，数学A":{"問題":[["https://www.toshin.com/kyotsutest/suugaku-1a_question_0.html","問題"]],"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=797&f=abm00006054.pdf&n=R8_%E3%80%90%E6%95%B0%E5%AD%A6%E2%85%A0%EF%BC%8C%E6%95%B0%E5%AD%A6A%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/data/3759/sugaku-1a.pdf","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_honsiken_seikai.html","掲載ページ"]]},
    "2026||main||数学Ⅱ，数学B，数学C":{"問題":[["https://www.toshin.com/kyotsutest/suugaku2bc_question_0.html","問題"]],"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=797&f=abm00006056.pdf&n=R8_%E3%80%90%E6%95%B0%E5%AD%A6%E2%85%A1%EF%BC%8C%E6%95%B0%E5%AD%A6B%EF%BC%8C%E6%95%B0%E5%AD%A6C%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/data/3760/sugaku-2bc.pdf","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_honsiken_seikai.html","掲載ページ"]]},
    "2026||main||歴史総合":{"問題":[["https://kyotsu.org/test/2026_%E6%AD%B4%E5%8F%B2%E7%B7%8F%E5%90%88_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=797&f=abm00006029.pdf&n=R8_%E3%80%90%E5%9C%B0%E7%B7%8F%EF%BC%8F%E6%AD%B4%E7%B7%8F%EF%BC%8F%E5%85%AC%E5%85%B1%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/data/3748/rekishisougou.pdf","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_honsiken_seikai.html","掲載ページ"]]},
    "2026||main||歴史総合，世界史探究":{"問題":[["https://kyotsu.org/test/2026_%E6%AD%B4%E5%8F%B2%E7%B7%8F%E5%90%88%E4%B8%96%E7%95%8C%E5%8F%B2%E6%8E%A2%E7%A9%B6_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=797&f=abm00006033.pdf&n=R8_%E3%80%90%E6%AD%B4%E5%8F%B2%E7%B7%8F%E5%90%88%EF%BC%8C%E4%B8%96%E7%95%8C%E5%8F%B2%E6%8E%A2%E7%A9%B6%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/data/3742/sekaishi-tankyu.pdf","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_honsiken_seikai.html","掲載ページ"]]},
    "2026||main||歴史総合，日本史探究":{"問題":[["https://www.toshin.com/kyotsutest/rekishi-nihonshi_question_0.html","問題"]],"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=797&f=abm00006032.pdf&n=R8_%E3%80%90%E6%AD%B4%E5%8F%B2%E7%B7%8F%E5%90%88%EF%BC%8C%E6%97%A5%E6%9C%AC%E5%8F%B2%E6%8E%A2%E7%A9%B6%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/data/3741/nihonshi-tankyu.pdf","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_honsiken_seikai.html","掲載ページ"]]},
    "2026||main||物理":{"問題":[["https://kyotsu.org/test/2026_%E7%89%A9%E7%90%86_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=797&f=abm00006049.pdf&n=R8_%E3%80%90%E7%89%A9%E7%90%86%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/data/3758/butsuri.pdf","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_honsiken_seikai.html","掲載ページ"]]},
    "2026||main||物理基礎":{"問題":[["https://www.toshin.com/kyotsutest/butsuri-kiso_question_0.html","問題"]],"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=797&f=abm00006051.pdf&n=R8_%E3%80%90%E5%9F%BA%E7%A4%8E%E7%A7%91%E7%9B%AE%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/data/3757/butsuri-kiso.pdf","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_honsiken_seikai.html","掲載ページ"]]},
    "2026||main||生物":{"問題":[["https://www.toshin.com/kyotsutest/seibutsu_question_0.html","問題"]],"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=797&f=abm00006047.pdf&n=R8_%E3%80%90%E7%94%9F%E7%89%A9%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/data/3762/seibutsu.pdf","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_honsiken_seikai.html","掲載ページ"]]},
    "2026||main||生物基礎":{"問題":[["https://www.toshin.com/kyotsutest/seibutsu-kiso_question_0.html","問題"]],"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=797&f=abm00006051.pdf&n=R8_%E3%80%90%E5%9F%BA%E7%A4%8E%E7%A7%91%E7%9B%AE%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/data/3761/seibutsu-kiso.pdf","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_honsiken_seikai.html","掲載ページ"]]},
    "2026||main||英語（リスニング）":{"問題":[["https://kyotsu.org/test/2026_%E8%8B%B1%E8%AA%9EL_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=797&f=abm00006037.pdf&n=R8_%E3%80%90%E8%8B%B1%E8%AA%9E%EF%BC%88%E3%83%AA%E3%82%B9%E3%83%8B%E3%83%B3%E3%82%B0%EF%BC%89%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/data/3756/listening.pdf","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_honsiken_seikai.html","掲載ページ"]]},
    "2026||main||英語（リーディング）":{"問題":[["https://kyotsu.org/test/2026_%E8%8B%B1%E8%AA%9ER_%E6%9C%AC%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=797&f=abm00006039.pdf&n=R8_%E3%80%90%E8%8B%B1%E8%AA%9E%EF%BC%88%E3%83%AA%E3%83%BC%E3%83%87%E3%82%A3%E3%83%B3%E3%82%B0%EF%BC%89%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://www.toshin.com/kyotsutest/data/3755/reading.pdf","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_honsiken_seikai.html","掲載ページ"]]},
    "2026||retake||公共":{"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=798&f=abm00006074.pdf&n=R8_%E8%BF%BD%E3%83%BB%E5%86%8D%E8%A9%A6%E9%A8%93%E3%80%90%E5%9C%B0%E7%B7%8F%EF%BC%8F%E6%AD%B4%E7%B7%8F%EF%BC%8F%E5%85%AC%E5%85%B1%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_tuisaisiken_seikai.html","掲載ページ"]]},
    "2026||retake||公共，倫理":{"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=798&f=abm00006073.pdf&n=R8_%E8%BF%BD%E3%83%BB%E5%86%8D%E8%A9%A6%E9%A8%93%E3%80%90%E5%85%AC%E5%85%B1%EF%BC%8C%E5%80%AB%E7%90%86%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://brg.plus/courses/%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88-%E5%85%AC%E5%85%B1%E3%83%BB%E5%80%AB%E7%90%86-%E9%81%8E%E5%8E%BB%E5%95%8F%E5%85%A8%E5%B0%8F%E5%95%8F%E8%A7%A3%E8%AA%AC%EF%BC%882027%E5%B9%B4%E5%BA%A6/","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_tuisaisiken_seikai.html","掲載ページ"]]},
    "2026||retake||公共，政治・経済":{"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=798&f=abm00006072.pdf&n=R8_%E8%BF%BD%E3%83%BB%E5%86%8D%E8%A9%A6%E9%A8%93%E3%80%90%E5%85%AC%E5%85%B1%EF%BC%8C%E6%94%BF%E6%B2%BB%E7%B5%8C%E6%B8%88%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://brg.plus/courses/%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88-%E5%85%AC%E5%85%B1%E3%83%BB%E6%94%BF%E6%B2%BB%E7%B5%8C%E6%B8%88-%E9%81%8E%E5%8E%BB%E5%95%8F%E5%85%A8%E5%B0%8F%E5%95%8F%E8%A7%A3%E8%AA%AC%EF%BC%882027/","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_tuisaisiken_seikai.html","掲載ページ"]]},
    "2026||retake||化学":{"問題":[["https://kyotsu.org/test/2026_%E5%8C%96%E5%AD%A6_%E8%BF%BD%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=798&f=abm00006093.pdf&n=R8_%E8%BF%BD%E3%83%BB%E5%86%8D%E8%A9%A6%E9%A8%93%E3%80%90%E5%8C%96%E5%AD%A6%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://brg.plus/courses/%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88-%E5%8C%96%E5%AD%A6-%E9%81%8E%E5%8E%BB%E5%95%8F%E5%85%A8%E5%B0%8F%E5%95%8F%E8%A7%A3%E8%AA%AC%EF%BC%882027%E5%B9%B4%E5%BA%A6%E5%85%A5%E8%A9%A6%E5%AF%BE/","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_tuisaisiken_seikai.html","掲載ページ"]]},
    "2026||retake||化学基礎":{"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=798&f=abm00006091.pdf&n=R8_%E8%BF%BD%E3%83%BB%E5%86%8D%E8%A9%A6%E9%A8%93%E3%80%90%E5%9F%BA%E7%A4%8E%E7%A7%91%E7%9B%AE%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://brg.plus/courses/%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88-%E5%8C%96%E5%AD%A6%E5%9F%BA%E7%A4%8E-%E9%81%8E%E5%8E%BB%E5%95%8F%E5%85%A8%E5%B0%8F%E5%95%8F%E8%A7%A3%E8%AA%AC%EF%BC%882027%E5%B9%B4%E5%BA%A6%E5%85%A5/","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_tuisaisiken_seikai.html","掲載ページ"]]},
    "2026||retake||国語":{"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=798&f=abm00006068.pdf&n=R8_%E8%BF%BD%E3%83%BB%E5%86%8D%E8%A9%A6%E9%A8%93%E3%80%90%E5%9B%BD%E8%AA%9E%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://exam-strategy.jp/archives/413336","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_tuisaisiken_seikai.html","掲載ページ"]]},
    "2026||retake||地学":{"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=798&f=abm00006095.pdf&n=R8_%E8%BF%BD%E3%83%BB%E5%86%8D%E8%A9%A6%E9%A8%93%E3%80%90%E5%9C%B0%E5%AD%A6%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_tuisaisiken_seikai.html","掲載ページ"]]},
    "2026||retake||地学基礎":{"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=798&f=abm00006091.pdf&n=R8_%E8%BF%BD%E3%83%BB%E5%86%8D%E8%A9%A6%E9%A8%93%E3%80%90%E5%9F%BA%E7%A4%8E%E7%A7%91%E7%9B%AE%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://brg.plus/courses/%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88-%E5%9C%B0%E5%AD%A6%E5%9F%BA%E7%A4%8E-%E9%81%8E%E5%8E%BB%E5%95%8F%E5%85%A8%E5%B0%8F%E5%95%8F%E8%A7%A3%E8%AA%AC%EF%BC%882027%E5%B9%B4%E5%BA%A6%E5%85%A5/","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_tuisaisiken_seikai.html","掲載ページ"]]},
    "2026||retake||地理総合":{"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=798&f=abm00006074.pdf&n=R8_%E8%BF%BD%E3%83%BB%E5%86%8D%E8%A9%A6%E9%A8%93%E3%80%90%E5%9C%B0%E7%B7%8F%EF%BC%8F%E6%AD%B4%E7%B7%8F%EF%BC%8F%E5%85%AC%E5%85%B1%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_tuisaisiken_seikai.html","掲載ページ"]]},
    "2026||retake||地理総合，地理探究":{"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=798&f=abm00006070.pdf&n=R8_%E8%BF%BD%E3%83%BB%E5%86%8D%E8%A9%A6%E9%A8%93%E3%80%90%E5%9C%B0%E7%90%86%E7%B7%8F%E5%90%88%EF%BC%8C%E5%9C%B0%E7%90%86%E6%8E%A2%E7%A9%B6%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_tuisaisiken_seikai.html","掲載ページ"]]},
    "2026||retake||情報Ⅰ":{"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=798&f=abm00006099.pdf&n=R8_%E8%BF%BD%E3%83%BB%E5%86%8D%E8%A9%A6%E9%A8%93%E3%80%90%E6%83%85%E5%A0%B1%E2%85%A0%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_tuisaisiken_seikai.html","掲載ページ"]]},
    "2026||retake||数学Ⅰ":{"問題":[["https://kyotsu.org/test/2026_%E6%95%B0%E5%AD%A6I_%E8%BF%BD%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=798&f=abm00006097.pdf&n=R8_%E8%BF%BD%E3%83%BB%E5%86%8D%E8%A9%A6%E9%A8%93%E3%80%90%E6%95%B0%E5%AD%A6%E2%85%A0%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://mathabyss.com/kyotutest2026_math1/","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_tuisaisiken_seikai.html","掲載ページ"]]},
    "2026||retake||数学Ⅰ，数学A":{"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=798&f=abm00006096.pdf&n=R8_%E8%BF%BD%E3%83%BB%E5%86%8D%E8%A9%A6%E9%A8%93%E3%80%90%E6%95%B0%E5%AD%A6%E2%85%A0%EF%BC%8C%E6%95%B0%E5%AD%A6A%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://mathabyss.com/kyotutest2026_math1/","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_tuisaisiken_seikai.html","掲載ページ"]]},
    "2026||retake||数学Ⅱ，数学B，数学C":{"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=798&f=abm00006098.pdf&n=R8_%E8%BF%BD%E3%83%BB%E5%86%8D%E8%A9%A6%E9%A8%93%E3%80%90%E6%95%B0%E5%AD%A6%E2%85%A1%EF%BC%8C%E6%95%B0%E5%AD%A6B%EF%BC%8C%E6%95%B0%E5%AD%A6C%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://mathabyss.com/kyotutest2026_math2/","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_tuisaisiken_seikai.html","掲載ページ"]]},
    "2026||retake||歴史総合":{"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=798&f=abm00006074.pdf&n=R8_%E8%BF%BD%E3%83%BB%E5%86%8D%E8%A9%A6%E9%A8%93%E3%80%90%E5%9C%B0%E7%B7%8F%EF%BC%8F%E6%AD%B4%E7%B7%8F%EF%BC%8F%E5%85%AC%E5%85%B1%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_tuisaisiken_seikai.html","掲載ページ"]]},
    "2026||retake||歴史総合，世界史探究":{"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=798&f=abm00006071.pdf&n=R8_%E8%BF%BD%E3%83%BB%E5%86%8D%E8%A9%A6%E9%A8%93%E3%80%90%E6%AD%B4%E5%8F%B2%E7%B7%8F%E5%90%88%EF%BC%8C%E4%B8%96%E7%95%8C%E5%8F%B2%E6%8E%A2%E7%A9%B6%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://brg.plus/courses/%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88-%E6%AD%B4%E5%8F%B2%E7%B7%8F%E5%90%88%E3%83%BB%E4%B8%96%E7%95%8C%E5%8F%B2%E6%8E%A2%E6%B1%82-%E9%81%8E%E5%8E%BB%E5%95%8F%E5%85%A8%E5%B0%8F%E5%95%8F%E8%A7%A3/","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_tuisaisiken_seikai.html","掲載ページ"]]},
    "2026||retake||歴史総合，日本史探究":{"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=798&f=abm00006069.pdf&n=R8_%E8%BF%BD%E3%83%BB%E5%86%8D%E8%A9%A6%E9%A8%93%E3%80%90%E6%AD%B4%E5%8F%B2%E7%B7%8F%E5%90%88%EF%BC%8C%E6%97%A5%E6%9C%AC%E5%8F%B2%E6%8E%A2%E7%A9%B6%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://brg.plus/courses/%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88-%E6%AD%B4%E5%8F%B2%E7%B7%8F%E5%90%88%E3%83%BB%E6%97%A5%E6%9C%AC%E5%8F%B2%E6%8E%A2%E6%B1%82-%E9%81%8E%E5%8E%BB%E5%95%8F%E5%85%A8%E5%B0%8F%E5%95%8F%E8%A7%A3/","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_tuisaisiken_seikai.html","掲載ページ"]]},
    "2026||retake||物理":{"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=798&f=abm00006092.pdf&n=R8_%E8%BF%BD%E3%83%BB%E5%86%8D%E8%A9%A6%E9%A8%93%E3%80%90%E7%89%A9%E7%90%86%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://brg.plus/courses/%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88-%E7%89%A9%E7%90%86-%E9%81%8E%E5%8E%BB%E5%95%8F%E5%85%A8%E5%B0%8F%E5%95%8F%E8%A7%A3%E8%AA%AC%EF%BC%882027%E5%B9%B4%E5%BA%A6%E5%85%A5%E8%A9%A6%E5%AF%BE/","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_tuisaisiken_seikai.html","掲載ページ"]]},
    "2026||retake||物理基礎":{"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=798&f=abm00006091.pdf&n=R8_%E8%BF%BD%E3%83%BB%E5%86%8D%E8%A9%A6%E9%A8%93%E3%80%90%E5%9F%BA%E7%A4%8E%E7%A7%91%E7%9B%AE%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://brg.plus/courses/%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88-%E7%89%A9%E7%90%86%E5%9F%BA%E7%A4%8E-%E9%81%8E%E5%8E%BB%E5%95%8F%E5%85%A8%E5%B0%8F%E5%95%8F%E8%A7%A3%E8%AA%AC%EF%BC%882027%E5%B9%B4%E5%BA%A6%E5%85%A5/","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_tuisaisiken_seikai.html","掲載ページ"]]},
    "2026||retake||生物":{"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=798&f=abm00006094.pdf&n=R8_%E8%BF%BD%E3%83%BB%E5%86%8D%E8%A9%A6%E9%A8%93%E3%80%90%E7%94%9F%E7%89%A9%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://i-my-mine.hatenablog.com/entry/2026/03/25/2026%E5%B9%B4%E5%BA%A6%E5%A4%A7%E5%AD%A6%E5%85%A5%E8%A9%A6%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E8%BF%BD%E8%A9%A6_%E7%94%9F%E7%89%A9_%E6%89%80%E6%84%9F","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_tuisaisiken_seikai.html","掲載ページ"]]},
    "2026||retake||生物基礎":{"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=798&f=abm00006091.pdf&n=R8_%E8%BF%BD%E3%83%BB%E5%86%8D%E8%A9%A6%E9%A8%93%E3%80%90%E5%9F%BA%E7%A4%8E%E7%A7%91%E7%9B%AE%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://i-my-mine.hatenablog.com/entry/2026/03/24/2026%E5%B9%B4%E5%BA%A6%E5%A4%A7%E5%AD%A6%E5%85%A5%E8%A9%A6%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88%E8%BF%BD%E8%A9%A6_%E7%94%9F%E7%89%A9%E5%9F%BA%E7%A4%8E_%E6%89%80%E6%84%9F","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_tuisaisiken_seikai.html","掲載ページ"]]},
    "2026||retake||英語（リスニング）":{"問題":[["https://kyotsu.org/test/2026_%E8%8B%B1%E8%AA%9EL_%E8%BF%BD%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=798&f=abm00006079.pdf&n=R8%E8%BF%BD%E3%83%BB%E5%86%8D%E8%A9%A6%E9%A8%93%E3%80%90%E8%8B%B1%E8%AA%9E%EF%BC%88%E3%83%AA%E3%82%B9%E3%83%8B%E3%83%B3%E3%82%B0%EF%BC%89%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://nekoeigo.net/center/kakomon-html","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_tuisaisiken_seikai.html","掲載ページ"]]},
    "2026||retake||英語（リーディング）":{"問題":[["https://kyotsu.org/test/2026_%E8%8B%B1%E8%AA%9ER_%E8%BF%BD%E8%A9%A6%E9%A8%93%E5%95%8F%E9%A1%8C.pdf","問題"]],"解答":[["https://www.dnc.ac.jp/albums/abm.php?d=798&f=abm00006083.pdf&n=R8_%E8%BF%BD%E3%83%BB%E5%86%8D%E8%A9%A6%E9%A8%93%E3%80%90%E8%8B%B1%E8%AA%9E%EF%BC%88%E3%83%AA%E3%83%BC%E3%83%87%E3%82%A3%E3%83%B3%E3%82%B0%EF%BC%89%E3%80%91%E7%99%BA%E8%A1%A8%E7%94%A8%E6%AD%A3%E8%A7%A3.pdf","解答"]],"解説":[["https://brg.plus/courses/%E5%85%B1%E9%80%9A%E3%83%86%E3%82%B9%E3%83%88-%E8%8B%B1%E8%AA%9Er-%E9%81%8E%E5%8E%BB%E5%95%8F%E5%85%A8%E5%B0%8F%E5%95%8F%E8%A7%A3%E8%AA%AC%EF%BC%882027%E5%B9%B4%E5%BA%A6%E5%85%A5%E8%A9%A6%E5%AF%BE/","解説"]],"掲載ページ":[["https://www.dnc.ac.jp/kyotsu/kakomondai/r8/r8_tuisaisiken_seikai.html","掲載ページ"]]},
    "2026||mock-benesse-2026-05||地理総合,地理探究":{},
    "2026||mock-benesse-2026-05||歴史総合,日本史探究":{},
    "2026||mock-benesse-2026-05||歴史総合,世界史探究":{},
    "2026||mock-benesse-2026-05||公共,政治・経済":{},
    "2026||mock-benesse-2026-05||公共,倫理":{},
    "2026||mock-benesse-2026-05||地理総合/歴史総合/公共":{},
    "2026||mock-benesse-2026-05||国語":{},
    "2026||mock-benesse-2026-05||英語R":{},
    "2026||mock-benesse-2026-05||英語L":{},
    "2026||mock-benesse-2026-05||数学IA":{},
    "2026||mock-benesse-2026-05||数学IIBC":{},
    "2026||mock-benesse-2026-05||情報I":{},
    "2026||mock-benesse-2026-05||物理基礎":{},
    "2026||mock-benesse-2026-05||化学基礎":{},
    "2026||mock-benesse-2026-05||生物基礎":{},
    "2026||mock-benesse-2026-05||地学基礎":{},
    "2026||mock-benesse-2026-05||物理":{},
    "2026||mock-benesse-2026-05||化学":{},
    "2026||mock-benesse-2026-05||生物":{},
    "2026||mock-benesse-2026-05||地学":{},
    "2026||mock-kawai-zento-2026-02||公共,倫理":{},
    "2026||mock-kawai-zento-2026-02||公共,政治・経済":{},
    "2026||mock-kawai-zento-2026-02||地理総合/歴史総合/公共":{},
    "2026||mock-kawai-zento-2026-02||英語R":{},
    "2026||mock-kawai-zento-2026-02||英語L":{},
    "2026||mock-kawai-zento-2026-02||情報I":{},
    "2026||mock-kawai-zento-2026-02||地理総合,地理探究":{},
    "2026||mock-kawai-zento-2026-02||歴史総合,日本史探究":{},
    "2026||mock-kawai-zento-2026-02||歴史総合,世界史探究":{},
    "2026||mock-kawai-zento-2026-02||国語":{},
    "2026||mock-kawai-zento-2026-02||数学IA":{},
    "2026||mock-kawai-zento-2026-02||数学I":{},
    "2026||mock-kawai-zento-2026-02||数学IIBC":{},
    "2026||mock-kawai-zento-2026-02||物理":{},
    "2026||mock-kawai-zento-2026-02||化学":{},
    "2026||mock-kawai-zento-2026-02||生物":{},
    "2026||mock-kawai-zento-2026-02||地学":{},
    "2026||mock-kawai-zento-2026-02||物理基礎":{},
    "2026||mock-kawai-zento-2026-02||化学基礎":{},
    "2026||mock-kawai-zento-2026-02||生物基礎":{},
    "2026||mock-kawai-zento-2026-02||地学基礎":{},
  };

  const STORAGE_KEY = 'ct-ui-lab-realdata-v1';
  const EXAM_LABELS = {
    main:'本試験',
    'mock-kawai-zento-2026-02':'第2回 河合全統共通テスト模試'
  };
  const $ = id => document.getElementById(id);
  const deepClone = value => JSON.parse(JSON.stringify(value));
  let keys = [];
  let statistics = {entries:[]};
  let currentKey = null;
  let answers = {};
  let currentIndex = 0;
  let currentGroupIndex = 0;
  let currentScreen = 'home';
  let lastResult = null;

  function norm(value){
    return String(value == null ? '' : value).normalize('NFKC').trim().replace(/[−ー―–—－]/g,'-').toLowerCase();
  }
  function esc(value){
    return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function qPoints(q){ return Number(q.points == null ? 1 : q.points) || 1; }
  function totalScore(k){ return (k.questions || []).reduce((sum,q)=>sum+qPoints(q),0); }
  function expected(q){ return Array.isArray(q.answers) ? q.answers.map(norm) : [norm(q.answer)]; }
  function expectedLength(q){
    if(Array.isArray(q.answers)) return q.answers.length;
    if(Array.isArray(q.conditionalCorrect)) return Math.max(1,...q.conditionalCorrect.map(c=>(c.answers||[]).length));
    if(Array.isArray(q.correctOptions)) return Math.max(1,...q.correctOptions.map(c=>c.length));
    return Math.max(1,norm(q.answer).length);
  }
  function normalizedGroup(value){
    const raw = String(value || '未分類');
    const match = raw.match(/^Q(\d+)([A-Z])?$/i);
    return match ? `第${match[1]}問${match[2] ? ' '+match[2].toUpperCase() : ''}` : raw;
  }
  function normalizeKey(k){
    const out = deepClone(k);
    out.questions = (out.questions || []).map(q=>{
      q.group = normalizedGroup(q.group || q.problemNumber);
      q.problemNumber = q.group;
      return q;
    });
    if(Array.isArray(out.selectionRules)){
      out.selectionRules.forEach(rule=>{ rule.groups = (rule.groups || []).map(normalizedGroup); });
    }
    return out;
  }
  function groupsFor(k){ return [...new Set((k.questions || []).map(q=>q.group || '未分類'))]; }
  function qKey(q){ return norm(q.group || q.problemNumber) + '||' + norm(q.id); }
  function keySignature(k){ return k ? [String(k.year),k.exam,k.subject].join('||') : ''; }
  function mergeSourceMetadata(k,sourceEntries){
    const out=deepClone(k);
    const meta=(sourceEntries||[]).find(item=>
      String(item.year)===String(k.year)&&item.exam===k.exam&&item.subject===k.subject
    );
    if(meta){
      ['source','sourceUrl','answerPdfUrl','sourcePageUrl','problemUrl','problemSource','explanationSource','explanationSourceUrl'].forEach(field=>{
        if((out[field]==null||out[field]==='')&&meta[field]!=null&&meta[field]!=='') out[field]=meta[field];
      });
    }
    if(String(out.year)==='2026'&&out.exam==='mock-kawai-zento-2026-02'){
      if(!out.sourceUrl) out.sourceUrl=KAWAI_GUIDE_URL;
      if(!out.explanationSourceUrl) out.explanationSourceUrl=KAWAI_GUIDE_URL;
    }
    return out;
  }
  function examText(k){
    const year=k&&k.year?`${k.year}年度 `:'';
    const exam=k?(EXAM_LABELS[k.exam]||k.exam||''):'';
    return `${year}${exam}`.trim();
  }
  function answerFor(q){ return answers[qKey(q)] || []; }
  function displayId(q){
    const id = String(q.id || '');
    const group = normalizedGroup(q.group || q.problemNumber);
    if(!group || group==='全体' || group==='未分類' || id.includes(group) || /^第\s*\d+\s*問/.test(id)) return id;
    return `${group}-${id}`;
  }
  function groupSortValue(group){
    const match = String(group).match(/第\s*(\d+)\s*問(?:\s*([A-Z]))?/i);
    return match ? [Number(match[1]),match[2] || ''] : [999,String(group)];
  }
  function groupCompare(a,b){
    const aa=groupSortValue(a),bb=groupSortValue(b);
    return aa[0]-bb[0] || String(aa[1]).localeCompare(String(bb[1]),'ja');
  }

  function readStore(){
    try{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"records":{}}'); }
    catch(_){ return {records:{}}; }
  }
  function writeStore(store){ localStorage.setItem(STORAGE_KEY,JSON.stringify(store)); }
  function saveCurrent(){
    if(!currentKey) return;
    const store=readStore();
    store.records=store.records||{};
    store.records[keySignature(currentKey)]={answers:deepClone(answers),currentIndex,savedAt:new Date().toISOString()};
    store.last=keySignature(currentKey);
    writeStore(store);
  }
  function loadSaved(k){
    const record=(readStore().records||{})[keySignature(k)];
    answers=record&&record.answers?deepClone(record.answers):{};
    currentIndex=record&&Number.isInteger(record.currentIndex)?Math.min(record.currentIndex,k.questions.length-1):0;
  }

  async function loadData(){
    try{
      const [mainResponse,statsResponse,sourceIndexResponse,...mockResponses]=await Promise.all([
        fetch('../answer_keys_verified.json',{cache:'no-store'}),
        fetch('../statistics_final.json',{cache:'no-store'}),
        fetch('../source_index.json',{cache:'no-store'}),
        ...DATA_FILES.map(file=>fetch(file,{cache:'no-store'}))
      ]);
      if(!mainResponse.ok) throw new Error('2025年度本試験データを読み込めませんでした。');
      const mainObject=await mainResponse.json();
      const mainKeys=(mainObject.keys||[]).filter(k=>String(k.year)==='2025'&&k.exam==='main');
      const mockObjects=await Promise.all(mockResponses.map(async response=>{
        if(!response.ok) throw new Error('河合模試データを読み込めませんでした。');
        return response.json();
      }));
      const mockKeys=mockObjects.flatMap(obj=>obj.keys||[]).filter(k=>String(k.year)==='2026'&&k.exam==='mock-kawai-zento-2026-02');
      let sourceEntries=[];
      if(sourceIndexResponse.ok){
        try{
          const sourceIndex=await sourceIndexResponse.json();
          sourceEntries=sourceIndex.included||[];
        }catch(error){
          console.warn('出典リンク索引を読み込めませんでした。',error);
        }
      }
      keys=[...mainKeys,...mockKeys].map(k=>normalizeKey(mergeSourceMetadata(k,sourceEntries)));
      if(statsResponse.ok) statistics=await statsResponse.json();
      setupSelectors();
    }catch(error){
      $('loadError').hidden=false;
      $('loadError').textContent='正解データの読み込みに失敗しました。ページを再読み込みしてください。 '+error.message;
      console.error(error);
    }
  }

  function setupSelectors(){
    const years=[...new Set(keys.map(k=>String(k.year)))].sort().reverse();
    $('yearSelect').innerHTML=years.map(y=>`<option value="${esc(y)}">${esc(y)}年度</option>`).join('');
    $('yearSelect').disabled=false;
    $('examSelect').disabled=false;
    $('subjectSelect').disabled=false;
    $('manualStartButton').disabled=false;
    refreshExamOptions();
  }
  function refreshExamOptions(){
    const year=$('yearSelect').value;
    const exams=[...new Set(keys.filter(k=>String(k.year)===year).map(k=>k.exam))];
    $('examSelect').innerHTML=exams.map(exam=>`<option value="${esc(exam)}">${esc(EXAM_LABELS[exam]||exam)}</option>`).join('');
    refreshSubjectOptions();
  }
  function subjectPriority(subject){
    const order=['国語','数学IA','数学Ⅰ，数学A','数学IIBC','数学Ⅱ，数学B，数学C','英語R','英語（リーディング）','英語L','英語（リスニング）','情報I','情報Ⅰ','物理','化学','生物','地学'];
    const i=order.indexOf(subject);
    return i<0?999:i;
  }
  function refreshSubjectOptions(){
    const year=$('yearSelect').value,exam=$('examSelect').value;
    const subjects=keys.filter(k=>String(k.year)===year&&k.exam===exam).map(k=>k.subject).sort((a,b)=>subjectPriority(a)-subjectPriority(b)||String(a).localeCompare(String(b),'ja'));
    const previous=$('subjectSelect').value;
    $('subjectSelect').innerHTML=subjects.map(subject=>`<option>${esc(subject)}</option>`).join('');
    if(subjects.includes(previous)) $('subjectSelect').value=previous;
    renderSubjectPreview();
  }
  function selectedKey(){
    return keys.find(k=>String(k.year)===$('yearSelect').value&&k.exam===$('examSelect').value&&k.subject===$('subjectSelect').value)||null;
  }
  function renderSubjectPreview(){
    const k=selectedKey();
    if(!k) return;
    $('previewSubject').textContent=k.subject;
    $('previewMeta').textContent=`${groupsFor(k).length}大問・${k.questions.length}項目${k.selectionRules?'・選択問題あり':''}`;
    $('questionCount').textContent=`${k.questions.length}項目`;
    $('maxScore').textContent=`${k.maxScore==null?totalScore(k):k.maxScore}点`;
    const links=[];
    const catalog=SOURCE_LINK_CATALOG[keySignature(k)]||{};
    ['問題','解答','解説'].forEach(kind=>{
      const items=(catalog[kind]||[]).filter(([url])=>/^https:\/\//.test(url));
      if(items.length){
        items.forEach(([url,label])=>links.push(`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`));
      }else{
        links.push(`<span aria-disabled="true" title="アクセスできる該当資料を確認できていません。" style="margin:0;border:1px solid #d9deea;border-radius:9px;padding:8px 10px;background:#f1f4f8;color:#667085;font-size:12px;font-weight:900">${kind}（確認不能）</span>`);
      }
    });
    (catalog['掲載ページ']||[]).filter(([url])=>/^https:\/\//.test(url)).forEach(([url,label])=>{
      links.push(`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`);
    });
    $('sourceLinks').innerHTML=links.join('');
  }
  function photoTemplateFor(k){
    const subject=String(k&&k.subject||'').normalize('NFKC');
    if(!subject.includes('数学')) return 'standard';
    return /(?:Ⅱ|II|2|IIBC|IIB|数学[^A]*[BC])/.test(subject) ? 'math2' : 'math1';
  }
  function renderMethodSelection(){
    if(!currentKey) return;
    $('methodSubject').textContent=currentKey.subject;
    $('methodExam').textContent=`${examText(currentKey)}　${groupsFor(currentKey).length}大問・${currentKey.questions.length}項目`;
  }
  function selectGradingSubject(){
    const k=selectedKey();
    if(!k) return;
    currentKey=k;
    renderMethodSelection();
    showScreen('method');
  }
  function openManualMethod(){
    if(currentKey) startKey(currentKey);
  }
  function openPhotoMethod(){
    if(!currentKey) return showScreen('home');
    const context={
      mode:'registered',
      template:photoTemplateFor(currentKey),
      signature:keySignature(currentKey),
      year:String(currentKey.year||''),
      exam:currentKey.exam,
      examText:examText(currentKey),
      subject:currentKey.subject,
      registeredKey:deepClone(currentKey)
    };
    if(window.UILabPhotoFlow&&typeof window.UILabPhotoFlow.configure==='function'){
      window.UILabPhotoFlow.configure(context);
    }
    showScreen('photo');
  }
  function openCustomCompare(){
    currentKey=null;
    const context={
      mode:'compare',
      template:'standard',
      signature:'custom-photo-compare',
      year:'',
      exam:'photo-compare',
      examText:'自分の持つ解答と照合'
    };
    if(window.UILabPhotoFlow&&typeof window.UILabPhotoFlow.configure==='function'){
      window.UILabPhotoFlow.configure(context);
    }
    showScreen('photo');
  }
  function photoFlowContext(){
    return window.UILabPhotoFlow&&typeof window.UILabPhotoFlow.getContext==='function'
      ? window.UILabPhotoFlow.getContext()
      : null;
  }
  function backFromPhoto(){
    const context=photoFlowContext();
    showScreen(context&&context.mode==='compare'?'home':'method');
  }
  function startKey(k){
    if(!k) return;
    currentKey=k;
    loadSaved(k);
    const groups=groupsFor(k),activeGroup=k.questions[currentIndex]&&k.questions[currentIndex].group;
    currentGroupIndex=Math.max(0,groups.indexOf(activeGroup));
    lastResult=null;
    window.__lastGrade=null;
    renderEntry();
    showScreen('entry');
  }
  function tokenSet(k){
    const values=[];
    (k.questions||[]).forEach(q=>{
      if(q.answer!=null) values.push(q.answer);
      if(Array.isArray(q.answers)) values.push(...q.answers);
      if(Array.isArray(q.correctOptions)) q.correctOptions.forEach(option=>values.push(...option));
      if(Array.isArray(q.conditionalCorrect)) q.conditionalCorrect.forEach(c=>values.push(...(c.answers||[])));
    });
    const joined=values.join('').normalize('NFKC').toUpperCase();
    const usedLetters=[...new Set(joined.match(/[A-Z]/g)||[])].sort();
    const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const highest=usedLetters.length?Math.max(2,...usedLetters.map(letter=>alphabet.indexOf(letter))):-1;
    const letters=highest>=0?alphabet.slice(0,highest+1):[];
    return {minus:joined.includes('-')||String(k.subject).includes('数学'),letters};
  }
  function renderNumberKeys(){
    const tokens=tokenSet(currentKey),layout=['1','2','3','4','5','6','7','8','9'];
    let html=layout.map(token=>`<button class="key" type="button" data-token="${token}">${token}</button>`).join('');
    if(tokens.minus) html+=`<button class="key" type="button" data-token="-">－</button><button class="key" type="button" data-token="0">0</button>`;
    else html+=`<button class="key zero-wide" type="button" data-token="0">0</button>`;
    html+=`<button class="key erase" type="button" data-action="erase" aria-label="1文字消す">⌫</button>`;
    $('numberKeys').innerHTML=html;
    $('numberKeys').querySelectorAll('[data-token]').forEach(button=>button.onclick=()=>inputToken(button.dataset.token));
    $('numberKeys').querySelector('[data-action="erase"]').onclick=eraseToken;
    $('letterKeys').hidden=!tokens.letters.length;
    $('letterKeys').innerHTML=tokens.letters.map(letter=>`<button class="key" type="button" data-token="${letter.toLowerCase()}">${letter}</button>`).join('');
    $('letterKeys').querySelectorAll('[data-token]').forEach(button=>button.onclick=()=>inputToken(button.dataset.token));
    requestAnimationFrame(updateKeypadHeight);
  }
  function renderEntry(){
    if(!currentKey) return;
    $('entryExam').textContent=examText(currentKey);
    $('entrySubject').textContent=currentKey.subject;
    renderGroupTabs();
    renderAnswerGrid();
    renderNumberKeys();
    renderProgress();
    renderKeypadCurrent();
  }
  function renderGroupTabs(){
    const groups=groupsFor(currentKey);
    $('groupTabs').innerHTML=groups.map((group,i)=>{
      const qs=currentKey.questions.filter(q=>q.group===group),done=qs.filter(q=>answerFor(q).length).length;
      return `<button class="group-tab ${i===currentGroupIndex?'active':''}" type="button" data-group="${i}">${esc(group)} ${done}/${qs.length}</button>`;
    }).join('');
    $('groupTabs').querySelectorAll('[data-group]').forEach(button=>button.onclick=()=>showGroup(Number(button.dataset.group)));
    const active=$('groupTabs').querySelector('.active');
    if(active) active.scrollIntoView({block:'nearest',inline:'center'});
  }
  function renderAnswerGrid(){
    const groups=groupsFor(currentKey),group=groups[currentGroupIndex],questions=currentKey.questions.filter(q=>q.group===group);
    $('groupHeading').textContent=group;
    const done=questions.filter(q=>answerFor(q).length).length;
    $('groupProgress').textContent=`${done} / ${questions.length}入力`;
    $('answerGrid').innerHTML=questions.map(q=>{
      const index=currentKey.questions.indexOf(q),value=answerFor(q).join('');
      return `<button type="button" class="answer-cell ${index===currentIndex?'active':''} ${value?'done':'empty'}" data-index="${index}" title="${esc(displayId(q))}"><span class="cell-id">${esc(q.id)}</span><span class="cell-value">${esc(value||'—')}</span></button>`;
    }).join('');
    $('answerGrid').querySelectorAll('[data-index]').forEach(button=>button.onclick=()=>selectQuestion(Number(button.dataset.index)));
    $('prevGroup').disabled=currentGroupIndex===0;
    $('nextGroup').disabled=currentGroupIndex===groups.length-1;
  }
  function renderProgress(){
    const entered=currentKey.questions.filter(q=>answerFor(q).length).length,total=currentKey.questions.length;
    $('entryProgressText').textContent=`${entered} / ${total}`;
    $('entryProgressBar').style.width=`${total?entered/total*100:0}%`;
  }
  function renderKeypadCurrent(){
    const q=currentKey.questions[currentIndex];
    if(!q) return;
    const value=answerFor(q).join('');
    $('currentQuestion').textContent=displayId(q);
    $('currentAnswer').textContent=value||'未入力';
  }
  function updateKeypadHeight(){
    if(window.innerWidth<=780&&$('keypad')) document.documentElement.style.setProperty('--keypad-height',$('keypad').offsetHeight+'px');
  }
  function selectQuestion(index){
    currentIndex=Math.max(0,Math.min(index,currentKey.questions.length-1));
    const group=currentKey.questions[currentIndex].group;
    currentGroupIndex=Math.max(0,groupsFor(currentKey).indexOf(group));
    renderGroupTabs();renderAnswerGrid();renderKeypadCurrent();saveCurrent();
  }
  function showGroup(index){
    const groups=groupsFor(currentKey);
    currentGroupIndex=Math.max(0,Math.min(index,groups.length-1));
    const first=currentKey.questions.findIndex(q=>q.group===groups[currentGroupIndex]);
    if(first>=0) currentIndex=first;
    renderGroupTabs();renderAnswerGrid();renderKeypadCurrent();saveCurrent();
  }
  function moveToIndex(index){ selectQuestion((index+currentKey.questions.length)%currentKey.questions.length); }
  function nextUnfilled(){
    for(let offset=1;offset<=currentKey.questions.length;offset++){
      const index=(currentIndex+offset)%currentKey.questions.length;
      if(!answerFor(currentKey.questions[index]).length){ selectQuestion(index); return; }
    }
    moveToIndex(currentIndex+1);
  }
  function inputToken(token){
    const q=currentKey.questions[currentIndex],id=qKey(q),max=expectedLength(q);
    let value=answers[id]||[];
    if(value.length>=max) value=[];
    value.push(norm(token));
    answers[id]=value;
    if(value.length>=max){
      const next=currentKey.questions.findIndex((item,i)=>i>currentIndex&&!answerFor(item).length);
      if(next>=0) currentIndex=next; else if(currentIndex<currentKey.questions.length-1) currentIndex++;
      currentGroupIndex=Math.max(0,groupsFor(currentKey).indexOf(currentKey.questions[currentIndex].group));
    }
    renderGroupTabs();renderAnswerGrid();renderProgress();renderKeypadCurrent();saveCurrent();
  }
  function eraseToken(){
    const q=currentKey.questions[currentIndex],id=qKey(q);
    answers[id]=(answers[id]||[]).slice(0,-1);
    if(!answers[id].length) delete answers[id];
    renderGroupTabs();renderAnswerGrid();renderProgress();renderKeypadCurrent();saveCurrent();
  }

  function eq(a,b,unordered){
    a=(a||[]).map(norm);b=(b||[]).map(norm);
    if(a.length!==b.length) return false;
    if(unordered){a=a.slice().sort();b=b.slice().sort();}
    return a.every((value,i)=>value===b[i]);
  }
  function getById(id,group){
    const inGroup=currentKey.questions.find(q=>q.group===group&&norm(q.id)===norm(id));
    if(inGroup) return answerFor(inGroup);
    const all=currentKey.questions.filter(q=>norm(q.id)===norm(id));
    return all.length===1?answerFor(all[0]):[];
  }
  function matchAnswer(got,q){
    if(q.alwaysAward) return qPoints(q);
    if(Array.isArray(q.conditionalCorrect)){
      for(const condition of q.conditionalCorrect){
        const conditionOk=Array.isArray(condition.allOf)
          ?condition.allOf.every(d=>eq(getById(d.ifId,q.group),d.ifEquals||[],!!d.ifUnordered))
          :eq(getById(condition.ifId,q.group),condition.ifEquals||[],!!condition.ifUnordered);
        if(conditionOk&&eq(got,condition.answers||[],!!condition.unordered)) return qPoints(q);
      }
      return 0;
    }
    if(Array.isArray(q.correctOptions)&&q.correctOptions.some(option=>eq(got,option,!!q.unordered))) return qPoints(q);
    if(eq(got,expected(q),!!q.unordered)) return qPoints(q);
    if(q.partialAnyCorrect){
      const ex=expected(q);let matches=0;
      if(q.unordered){
        const remaining=ex.slice();
        for(const value of (got||[]).map(norm)){const index=remaining.indexOf(value);if(index>=0){matches++;remaining.splice(index,1);}}
      }else{
        for(let i=0;i<Math.min((got||[]).length,ex.length);i++) if(norm(got[i])===norm(ex[i])) matches++;
      }
      if(matches>0) return Math.min(qPoints(q),Number(q.partialAnyCorrect)*matches);
    }
    if(Array.isArray(q.partialConditions)) for(const partial of q.partialConditions){
      const partialAnswers=Array.isArray(partial.answers)?partial.answers:[partial.answer];
      if(got.length===partialAnswers.length&&partialAnswers.every((value,i)=>value==='*'||value===null||norm(got[i])===norm(value))) return Number(partial.points||0);
    }
    if(Array.isArray(q.partialAnswers)) for(const partial of q.partialAnswers){
      const partialAnswers=Array.isArray(partial.answers)?partial.answers:[partial.answer];
      if(eq(got,partialAnswers,!!partial.unordered)) return Number(partial.points||0);
    }
    return 0;
  }
  function expText(q){
    if(q.alwaysAward) return '全員得点';
    if(Array.isArray(q.correctOptions)) return q.correctOptions.map(option=>option.join('')).join(' または ');
    if(Array.isArray(q.conditionalCorrect)) return q.conditionalCorrect.map(c=>`${Array.isArray(c.allOf)?c.allOf.map(d=>`${d.ifId}=${(d.ifEquals||[]).join('')}`).join('&'):`${c.ifId}=${(c.ifEquals||[]).join('')}`}→${(c.answers||[]).join('')}`).join(' / ');
    return expected(q).join('');
  }
  function statsFor(k){ return (statistics.entries||[]).find(s=>String(s.year)===String(k.year)&&s.exam===k.exam&&s.subject===k.subject)||null; }
  function statForQuestion(k,q){
    const stats=statsFor(k);
    return stats&&Array.isArray(stats.items)?stats.items.find(item=>String(item.id)===String(q.id)):null;
  }
  function statRateHtml(k,q){
    const stat=statForQuestion(k,q);
    if(!stat) return '—';
    if(Array.isArray(stat.correctRateByPart)) return stat.correctRateByPart.map(x=>`${esc(x.id)}：${Number(x.correctRate).toFixed(2)}%`).join('<br>');
    return stat.correctRate==null?'—':Number(stat.correctRate).toFixed(2)+'%';
  }
  function rowNote(k,row){
    const stat=statForQuestion(k,row.q);
    return [row.q.note||'',stat&&stat.note||''].filter(Boolean).join(' / ');
  }
  function sectionStats(rows){
    const included=rows.filter(row=>row.included);
    const map=new Map();
    included.forEach(row=>{
      const group=normalizedGroup(row.q.group||row.q.problemNumber);
      if(!map.has(group)) map.set(group,{group,earn:0,max:0,items:0,correct:0,missing:0});
      const stat=map.get(group);stat.earn+=row.earn;stat.max+=row.pts;stat.items++;
      if(row.earn===row.pts) stat.correct++;
      if(!row.got.length) stat.missing++;
    });
    return [...map.values()].sort((a,b)=>groupCompare(a.group,b.group));
  }
  function calculateResult(){
    const rows=currentKey.questions.map((q,i)=>({q,i,got:answerFor(q),earn:matchAnswer(answerFor(q),q),pts:qPoints(q),included:true}));
    let score=0,possible=0,correct=0,missing=0;
    const optionalGroups=new Set();
    if(Array.isArray(currentKey.selectionRules)){
      currentKey.selectionRules.forEach(rule=>(rule.groups||[]).forEach(group=>optionalGroups.add(group)));
      rows.filter(row=>!optionalGroups.has(row.q.group)).forEach(row=>{possible+=row.pts;score+=row.earn;if(row.earn===row.pts)correct++;if(!row.got.length)missing++;});
      currentKey.selectionRules.forEach(rule=>{
        const stats=(rule.groups||[]).map(group=>{
          const groupRows=rows.filter(row=>row.q.group===group);
          return {group,rows:groupRows,max:groupRows.reduce((sum,row)=>sum+row.pts,0),earn:groupRows.reduce((sum,row)=>sum+row.earn,0),has:groupRows.some(row=>row.got.length)};
        }).sort((a,b)=>(Number(b.has)-Number(a.has))||(b.earn-a.earn));
        const chosen=stats.slice(0,Number(rule.choose||1)),chosenSet=new Set(chosen.map(item=>item.group));
        stats.forEach(item=>item.rows.forEach(row=>{row.included=chosenSet.has(item.group);}));
        chosen.forEach(item=>item.rows.forEach(row=>{possible+=row.pts;score+=row.earn;if(row.earn===row.pts)correct++;if(!row.got.length)missing++;}));
      });
    }else rows.forEach(row=>{possible+=row.pts;score+=row.earn;if(row.earn===row.pts)correct++;if(!row.got.length)missing++;});
    const max=currentKey.maxScore==null?possible:Number(currentKey.maxScore),display=possible?score*max/possible:score,rate=possible?score/possible*100:0;
    const includedCount=rows.filter(row=>row.included).length;
    const correctRate=includedCount?correct/includedCount*100:0;
    return {k:currentKey,rows,score,possible,okc:correct,missing,mx:max,disp:display,rate,correctRate,sig:keySignature(currentKey),createdAt:new Date()};
  }

  function radarSvg(stats){
    if(!stats.length) return '';
    const n=stats.length,cx=160,cy=160,r=110;
    const point=(i,ratio)=>{const angle=-Math.PI/2+Math.PI*2*i/n;return [cx+Math.cos(angle)*r*ratio,cy+Math.sin(angle)*r*ratio];};
    const grid=[.25,.5,.75,1].map(ratio=>`<polygon class="radarGrid" points="${stats.map((_,i)=>point(i,ratio).join(',')).join(' ')}"></polygon>`).join('');
    const axes=stats.map((stat,i)=>{const end=point(i,1),angle=-Math.PI/2+Math.PI*2*i/n,label=[cx+Math.cos(angle)*(r+26),cy+Math.sin(angle)*(r+26)];return `<line class="radarAxis" x1="${cx}" y1="${cy}" x2="${end[0]}" y2="${end[1]}"></line><text x="${label[0]}" y="${label[1]}" text-anchor="middle" dominant-baseline="middle" font-size="11" fill="#344054">${esc(stat.group)}</text>`;}).join('');
    const scorePoints=stats.map((stat,i)=>point(i,stat.items?stat.correct/stat.items:0));
    return `<svg class="radarSvg" viewBox="0 0 320 320" role="img" aria-label="問題番号別正答率レーダーチャート">${grid}${axes}<polygon class="radarShape" points="${scorePoints.map(p=>p.join(',')).join(' ')}"></polygon>${scorePoints.map(p=>`<circle class="radarPoint" cx="${p[0]}" cy="${p[1]}" r="3"></circle>`).join('')}</svg>`;
  }
  function renderResult(result){
    const stats=sectionStats(result.rows),included=result.rows.filter(row=>row.included),average=statsFor(result.k),bad=included.filter(row=>!row.got.length||row.earn<row.pts),photo=result.inputMode==='photo',pointsAvailable=result.pointsAvailable!==false;
    const averageValue=average&&average.averageScore!=null?Number(average.averageScore).toFixed(2):'—';
    const sectionRows=stats.map(stat=>`<tr><td>${esc(stat.group)}</td><td>${pointsAvailable?`${Math.round(stat.earn*10)/10} / ${stat.max}`:`${stat.correct} / ${stat.items}`}</td><td>${stat.items?Math.round(stat.correct/stat.items*1000)/10:0}%</td><td>${stat.correct} / ${stat.items}</td><td>${stat.missing}</td></tr>`).join('');
    const allRows=result.rows.map(row=>{
      const judge=!row.included?'—':row.earn===row.pts?'○':row.earn>0?'△':'×',judgeClass=judge==='○'?'ok':judge==='△'?'partial':judge==='×'?'ng':'';
      return `<tr><td>${esc(displayId(row.q))}</td><td>${esc(row.got.join('')||'未入力')}</td><td>${esc(expText(row.q))}</td><td class="${judgeClass}">${judge}</td><td>${row.included?(pointsAvailable?`${row.earn} / ${row.pts}`:'—'):'対象外'}</td><td>${statRateHtml(result.k,row.q)}</td><td>${esc(rowNote(result.k,row)||'—')}</td></tr>`;
    }).join('');
    const missed=bad.length?`<div class="missedPanel"><h3>間違えた問題・未入力</h3><div class="missedList">${bad.map(row=>`<div class="missedItem"><b>${esc(displayId(row.q))}　${!row.got.length?'未入力':row.earn>0?'△':'×'}</b>自分：${esc(row.got.join('')||'未入力')} / 正解：${esc(expText(row.q))}${pointsAvailable?`<br>得点：${row.earn} / ${row.pts}`:''}</div>`).join('')}</div></div>`:'<div class="missedOk">間違えた問題・未入力はありません</div>';
    const editLabel=photo?'読取結果を修正':'解答を修正';
    $('result').innerHTML=`
      <div class="result-action-top">
        <div class="resultActionBar"><div class="resultActionLabel">採点結果</div><div class="resultActionIdentity"><span class="resultExamLine">${esc(examText(result.k))}</span><span class="resultSubjectLine">${esc(result.k.subject)}</span></div></div>
        <div class="result-buttons"><button type="button" id="editFromResult">${editLabel}</button><button class="pdf-button" type="button" id="exportPdfResult">PDF出力（A4）</button></div>
      </div>
      <div class="resultSummaryCard">
        <div><div class="resultSummarySubject">${esc(result.k.subject)}</div><div class="resultSummaryMeta">${esc(examText(result.k))}</div>${averageValue!=='—'?`<div class="avgScoreMetric"><span class="avgLabel">受験者平均点</span><b class="avgValue">${esc(averageValue)}</b></div>`:''}</div>
        <div class="resultSummaryStats"><div class="resultSummaryStat"><span>${pointsAvailable?'点数':'正解数'}</span><b>${pointsAvailable?`${Math.round(result.disp*10)/10} / ${result.mx}`:`${result.okc} / ${included.length}`}</b></div><div class="resultSummaryStat"><span>正答率</span><b>${Math.round(result.correctRate*10)/10}%</b></div><div class="resultSummaryStat"><span>正答項目</span><b>${result.okc} / ${included.length}</b></div><div class="resultSummaryStat"><span>未入力</span><b>${result.missing}</b></div></div>
      </div>
      ${stats.length?`<div class="radarPanel"><h3>問題番号別正答率</h3><div class="radarWrap">${radarSvg(stats)}<div class="sectionStats"><table><thead><tr><th>問題番号</th><th>${pointsAvailable?'得点':'正解数'}</th><th>正答率</th><th>正答項目</th><th>未入力</th></tr></thead><tbody>${sectionRows}</tbody></table></div></div></div>`:''}
      <h2 class="table-title">全問正誤</h2><p class="tableScrollNotice">表は右にスクロールできます</p>
      <div class="resultTableWrap"><table class="resultTable"><thead><tr><th>番号</th><th>自分</th><th>正解</th><th>判定</th><th>${pointsAvailable?'得点':'配点'}</th><th>受験者正答率</th><th>注記</th></tr></thead><tbody>${allRows}</tbody></table></div>
      ${missed}
      <div class="result-bottom"><button type="button" id="editBottom">${editLabel}</button><button type="button" id="anotherSubject">別の科目を選ぶ</button></div>`;
    $('editFromResult').onclick=$('editBottom').onclick=()=>photo?returnToPhotoReview():showScreen('entry');
    $('anotherSubject').onclick=()=>showScreen('home');
  }

  function returnToPhotoReview(){
    if(window.UILabPhotoFlow&&typeof window.UILabPhotoFlow.showReview==='function') window.UILabPhotoFlow.showReview();
    showScreen('photo');
  }

  function presentPhotoGrade(photoGrade,context){
    if(!photoGrade||!Array.isArray(photoGrade.rows)) throw new Error('写真採点結果を表示できません。');
    const sourceKey=deepClone(photoGrade.key||{}),ctx=context||{};
    const k=normalizeKey(sourceKey);
    k.year=ctx.year||k.year||'';
    k.exam=ctx.mode==='registered'?(ctx.exam||k.exam):'自分の持つ解答と照合';
    k.subject=ctx.subject||k.subject||ctx.templateLabel||'写真採点';
    k.maxScore=photoGrade.maxScore;
    const rows=photoGrade.rows.map((row,i)=>{
      const q=deepClone(row.question||{});
      q.group=normalizedGroup(q.group||q.problemNumber||'全体');
      q.problemNumber=q.group;
      if(ctx.mode!=='registered'&&!q.note&&q.photoConfidence){
        q.note=({high:'AI確信度：高',medium:'AI確信度：中',low:'AI確信度：低'})[q.photoConfidence]||'';
      }
      return {q,i,got:(row.got||[]).map(norm),earn:Number(row.earned||0),pts:Number(row.points||0),included:row.included!==false};
    });
    const included=rows.filter(row=>row.included),correct=included.filter(row=>row.earn===row.pts).length,possible=included.reduce((sum,row)=>sum+row.pts,0);
    const result={
      k,rows,score:Number(photoGrade.rawScore||0),possible,okc:correct,missing:Number(photoGrade.missing||0),
      mx:Number(photoGrade.maxScore||possible),disp:Number(photoGrade.score||0),
      rate:possible?Number(photoGrade.rawScore||0)/possible*100:0,
      correctRate:included.length?correct/included.length*100:0,
      sig:ctx.signature||`photo||${Date.now()}`,createdAt:new Date(),inputMode:'photo',
      pointsAvailable:photoGrade.pointsAvailable!==false,photoContext:{...ctx}
    };
    lastResult=result;
    window.__lastGrade=result;
    renderResult(result);
    showScreen('result');
  }
  function requestGrade(){
    const missing=currentKey.questions.filter(q=>!answerFor(q).length).length;
    if(missing){
      $('missingMessage').textContent=`${missing}項目が未入力です。未入力は0点として採点できます。`;
      $('missingModal').hidden=false;
    }else gradeNow();
  }
  function gradeNow(){
    $('missingModal').hidden=true;
    saveCurrent();
    lastResult=calculateResult();
    window.__lastGrade=lastResult;
    renderResult(lastResult);
    showScreen('result');
  }

  function fillCheckAnswers(){
    const available=tokenSet(currentKey),candidates=['1','2','3','4','5','6','7','8','9','0',...(available.minus?['-']:[]),...available.letters.map(x=>x.toLowerCase())];
    currentKey.questions.forEach((q,index)=>{
      if(index%9===0){ delete answers[qKey(q)]; return; }
      let correct=Array.isArray(q.correctOptions)?q.correctOptions[0]:(Array.isArray(q.conditionalCorrect)?(q.conditionalCorrect[0].answers||[]):expected(q));
      correct=(correct||[]).map(norm);
      if(index%4===0){
        const wrong=candidates.find(token=>token!==correct[0])||'0';
        correct=correct.map((value,i)=>i===0?wrong:value);
      }
      answers[qKey(q)]=correct;
    });
    currentIndex=0;currentGroupIndex=0;renderEntry();saveCurrent();
  }
  function clearAllAnswers(){
    if(!confirm('この科目の入力をすべて消します。よろしいですか？')) return;
    answers={};currentIndex=0;currentGroupIndex=0;renderEntry();saveCurrent();
  }

  function updateSteps(step){
    document.querySelectorAll('.step').forEach((el,i)=>{
      el.classList.toggle('active',i===step-1);el.classList.toggle('done',i<step-1);
    });
  }
  function updateStepLabels(name){
    const labels=document.querySelectorAll('.steps .step b');
    if(labels[1]) labels[1].textContent=name==='method'?'採点方法を選ぶ':name==='photo'?'写真を撮影':'解答を入力';
    if(labels[2]) labels[2].textContent='採点結果';
  }
  function screenUrl(name){
    const url=new URL(location.href);
    if(name==='photo'||name==='method') url.searchParams.set('mode',name);
    else url.searchParams.delete('mode');
    return url.pathname+url.search+url.hash;
  }
  function applyScreen(name){
    currentScreen=name;
    $('homeScreen').hidden=name!=='home';$('methodScreen').hidden=name!=='method';$('entryScreen').hidden=name!=='entry';$('photoScreen').hidden=name!=='photo';$('resultScreen').hidden=name!=='result';
    document.body.classList.toggle('entry-mode',name==='entry');
    $('headerBack').hidden=name==='home';
    updateStepLabels(name);
    updateSteps(name==='home'?1:name==='method'||name==='entry'?2:name==='photo'&&window.__photoFlowStage==='result'?3:name==='photo'?2:3);
    if(name==='home'){renderSubjectPreview();}
    if(name==='method'){renderMethodSelection();}
    if(name==='entry'){renderEntry();requestAnimationFrame(updateKeypadHeight);}
    window.scrollTo({top:0,behavior:'instant'});
  }
  function showScreen(name,push=true){
    applyScreen(name);
    if(push&&history.state&&history.state.screen!==name) history.pushState({screen:name},'',screenUrl(name));
  }
  function backOne(){
    if(currentScreen==='result') lastResult&&lastResult.inputMode==='photo'?returnToPhotoReview():showScreen('entry');
    else if(currentScreen==='photo') backFromPhoto();
    else if(currentScreen==='entry') showScreen('method');
    else if(currentScreen==='method') showScreen('home');
  }
  function handleKeyboard(event){
    if(currentScreen!=='entry'||event.metaKey||event.ctrlKey||event.altKey) return;
    const token=event.key==='-'?'-':event.key.toLowerCase(),tokens=tokenSet(currentKey);
    if(/[0-9]/.test(token)||(token==='-'&&tokens.minus)||tokens.letters.map(x=>x.toLowerCase()).includes(token)){event.preventDefault();inputToken(token);}
    else if(event.key==='Backspace'||event.key==='Delete'){event.preventDefault();eraseToken();}
    else if(event.key==='ArrowLeft'){event.preventDefault();moveToIndex(currentIndex-1);}
    else if(event.key==='ArrowRight'||event.key==='Enter'){event.preventDefault();nextUnfilled();}
  }

  function bind(){
    $('yearSelect').onchange=refreshExamOptions;$('examSelect').onchange=refreshSubjectOptions;$('subjectSelect').onchange=renderSubjectPreview;
    $('manualStartButton').onclick=selectGradingSubject;$('customCompareButton').onclick=openCustomCompare;$('brandHome').onclick=()=>showScreen('home');
    $('methodBack').onclick=()=>showScreen('home');$('methodManual').onclick=openManualMethod;$('methodPhoto').onclick=openPhotoMethod;
    $('photoHomeBack').onclick=backFromPhoto;
    $('headerBack').onclick=backOne;$('backToSelection').onclick=()=>showScreen('method');
    $('previousField').onclick=()=>moveToIndex(currentIndex-1);$('nextBlank').onclick=nextUnfilled;$('manualGradeButton').onclick=requestGrade;
    $('prevGroup').onclick=()=>showGroup(currentGroupIndex-1);$('nextGroup').onclick=()=>showGroup(currentGroupIndex+1);
    $('returnToEntry').onclick=()=>{$('missingModal').hidden=true;};$('scoreAnyway').onclick=gradeNow;
    $('fillCheckAnswers').onclick=fillCheckAnswers;$('clearAllAnswers').onclick=clearAllAnswers;
    window.addEventListener('resize',updateKeypadHeight);window.addEventListener('orientationchange',()=>setTimeout(updateKeypadHeight,200));
    window.addEventListener('popstate',event=>applyScreen(event.state&&event.state.screen||'home'));
    document.addEventListener('keydown',handleKeyboard);
  }

  window.selId=()=>lastResult&&lastResult.inputMode==='photo'?lastResult.sig:keySignature(currentKey);
  window.grade=gradeNow;
  window.sectionStats=sectionStats;
  window.displayId=displayId;
  window.expText=expText;
  window.statRateHtml=statRateHtml;
  window.rowNote=rowNote;
  window.esc=esc;
  window.UILabPhotoNavigation={
    open:openPhotoMethod,
    setStage:stage=>{
      if(currentScreen!=='photo') return;
      updateSteps(stage==='result'?3:2);
      updateStepLabels('photo');
    },
    home:backFromPhoto
  };
  window.UILabResults={showPhotoGrade:presentPhotoGrade};

  const initialScreen='home';
  history.replaceState({screen:initialScreen},'',screenUrl(initialScreen));
  bind();
  applyScreen(initialScreen);
  loadData();
})();


