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
  // Source links verified 2026-09-05 (revision 1); only displayed links are overridden.
  const VERIFIED_SOURCE_LINKS = {
    "2008||center-main||化学I":{"解答":[["https://www.toshin.com/center/2008/pdf/a/kagaku_ans.pdf","解答"]]},
    "2008||center-main||地理B":{"問題":[["https://www.toshin.com/center/2008/pdf/q/chiri-b.pdf","問題"]]},
    "2008||center-main||数学II・B":{"問題":[["https://www.toshin.com/center/2008/sugaku-2b_mondai_0.html","問題"]]},
    "2008||center-main||英語（リスニング）":{"問題":[["https://www.toshin.com/center/2008/pdf/q/listning.pdf","問題"]]},
    "2012||center-main||世界史A":{"解答":[["https://www.toshin.com/center/2012/a/sekaishi-a_ans.pdf","解答"]]},
    "2012||center-main||世界史B":{"解答":[["https://www.toshin.com/center/2012/a/sekaishi-b_ans.pdf","解答"]]},
    "2012||center-main||化学I":{"問題":[["https://www.toshin.com/center/2012/kagaku_mondai_0.html","問題"]]},
    "2012||center-main||国語":{"問題":[["https://www.toshin.com/center/2012/kokugo_mondai_0.html","問題"]]},
    "2012||center-main||日本史A":{"解答":[["https://www.toshin.com/center/2012/nihonshi-a_ans.html","解答"]]},
    "2012||center-main||生物I":{"問題":[["https://www.toshin.com/center/2012/seibutsu_mondai_0.html","問題"]]},
    "2012||center-main||英語（リーディング）":{"問題":[["https://www.toshin.com/center/2012/eigo_mondai_0.html","問題"]]},
    "2014||center-main||国語":{"問題":[["https://www.toshin.com/center/2014/q/kokugo.pdf","問題"]]},
    "2014||center-main||地学I":{"問題":[["https://www.toshin.com/center/2014/chigaku_mondai_0.html","問題"]]},
    "2014||center-main||地理B":{"問題":[["https://www.toshin.com/center/2014/chiri-b_mondai_0.html","問題"]]},
    "2014||center-main||数学II・B":{"問題":[["https://www.toshin.com/center/2014/sugaku-2b_mondai_0.html","問題"]]},
    "2014||center-main||数学I・Ａ":{"問題":[["https://www.toshin.com/center/2014/sugaku-1a_mondai_0.html","問題"]]},
    "2014||center-main||物理I":{"問題":[["https://www.toshin.com/center/2014/butsuri_mondai_0.html","問題"]]},
    "2014||center-main||理科総合B":{"解答":[["https://www.toshin.com/center/2014/rikasougou-b_ans.html","解答"]]},
    "2014||center-main||英語（リスニング）":{"問題":[["https://www.toshin.com/center/2014/listning_mondai_0.html","問題"]]},
    "2014||center-main||英語（リーディング）":{"問題":[["https://www.toshin.com/center/2014/eigo_mondai_0.html","問題"]]},
    "2015||center-main||世界史A":{"問題":[["https://www.toshin.com/center/2015/sekaishi-a_mondai_0.html","問題"]]},
    "2015||center-main||倫理":{"問題":[["https://www.toshin.com/center/2015/rinri_mondai_0.html","問題"]]},
    "2015||center-main||化学基礎":{"問題":[["https://www.toshin.com/center/2015/q/kagaku-kiso.pdf","問題"]]},
    "2015||center-main||地学基礎":{"解答":[["https://www.toshin.com/center/2015/a/chigaku-kiso_ans.pdf","解答"]]},
    "2015||center-main||政治・経済":{"問題":[["https://www.toshin.com/center/2015/q/s-keizai.pdf","問題"]]},
    "2015||center-main||数学I・Ａ":{"解答":[["https://www.toshin.com/center/2015/sugaku-1a_ans.html","解答"]]},
    "2015||center-main||日本史B":{"問題":[["https://www.toshin.com/center/2015/nihonshi-b_mondai_0.html","問題"]]},
    "2015||center-main||生物基礎":{"解答":[["https://www.toshin.com/center/2015/seibutsu-kiso_ans.html","解答"]]},
    "2016||center-main||世界史A":{"問題":[["https://www.toshin.com/center/2016/sekaishi-a_mondai_0.html","問題"]]},
    "2016||center-main||倫理":{"問題":[["https://www.toshin.com/center/2016/q/rinri.pdf","問題"]]},
    "2016||center-main||倫理，政治・経済":{"問題":[["https://www.toshin.com/center/2016/q/rinri_seikei.pdf","問題"]],"解答":[["https://www.toshin.com/center/2016/rinri_seikei_ans.html","解答"]]},
    "2016||center-main||化学":{"問題":[["https://www.toshin.com/center/2016/kagaku_mondai_0.html","問題"]],"解答":[["https://www.toshin.com/center/2016/kagaku_ans.html","解答"]]},
    "2016||center-main||化学基礎":{"問題":[["https://www.toshin.com/center/2016/kagaku-kiso_mondai_0.html","問題"]],"解答":[["https://www.toshin.com/center/2016/kagaku-kiso_ans.html","解答"]]},
    "2016||center-main||地学":{"問題":[["https://www.toshin.com/center/2016/chigaku_mondai_0.html","問題"]]},
    "2016||center-main||地学基礎":{"問題":[["https://www.toshin.com/center/2016/chigaku-kiso_mondai_0.html","問題"]],"解答":[["https://www.toshin.com/center/2016/chigaku-kiso_ans.html","解答"]]},
    "2016||center-main||地理A":{"問題":[["https://www.toshin.com/center/2016/chiri-a_mondai_0.html","問題"]],"解答":[["https://www.toshin.com/center/2016/chiri-a_ans.html","解答"]]},
    "2016||center-main||政治・経済":{"問題":[["https://www.toshin.com/center/2016/s-keizai_mondai_0.html","問題"]],"解答":[["https://www.toshin.com/center/2016/s-keizai_ans.html","解答"]]},
    "2016||center-main||数学I":{"解答":[["https://www.toshin.com/center/2016/sugaku-1_ans.html","解答"]]},
    "2016||center-main||数学II":{"問題":[["https://www.toshin.com/center/2016/sugaku-2_mondai_0.html","問題"]],"解答":[["https://www.toshin.com/center/2016/sugaku-2_ans.html","解答"]]},
    "2016||center-main||日本史A":{"問題":[["https://www.toshin.com/center/2016/nihonshi-a_mondai_0.html","問題"]]},
    "2016||center-main||物理基礎":{"問題":[["https://www.toshin.com/center/2016/butsuri-kiso_mondai_0.html","問題"]]},
    "2016||center-main||現代社会":{"問題":[["https://www.toshin.com/center/2016/g-shakai_mondai_0.html","問題"]],"解答":[["https://www.toshin.com/center/2016/g-shakai_ans.html","解答"]]},
    "2016||center-main||生物":{"問題":[["https://www.toshin.com/center/2016/seibutsu_mondai_0.html","問題"]],"解答":[["https://www.toshin.com/center/2016/a/seibutsu_ans.pdf","解答"]]},
    "2016||center-main||生物基礎":{"問題":[["https://www.toshin.com/center/2016/q/seibutsu-kiso.pdf","問題"]]},
    "2016||center-main||英語（リーディング）":{"解答":[["https://www.toshin.com/center/2016/eigo_ans.html","解答"]]},
    "2017||center-main||世界史B":{"問題":[["https://www.toshin.com/center/2017/sekaishi-b_mondai_0.html","問題"]]},
    "2017||center-main||倫理":{"解答":[["https://www.toshin.com/center/2017/rinri_ans.html","解答"]]},
    "2017||center-main||化学基礎":{"問題":[["https://www.toshin.com/center/2017/kagaku-kiso_mondai_0.html","問題"]],"解答":[["https://www.toshin.com/center/2017/kagaku-kiso_ans.html","解答"]]},
    "2017||center-main||国語":{"問題":[["https://www.toshin.com/center/2017/kokugo_mondai_0.html","問題"]]},
    "2017||center-main||地理A":{"解答":[["https://www.toshin.com/center/2017/chiri-a_ans.html","解答"]]},
    "2017||center-main||数学II・B":{"問題":[["https://www.toshin.com/center/2017/sugaku-2b_mondai_0.html","問題"]]},
    "2017||center-main||数学I・Ａ":{"問題":[["https://www.toshin.com/center/2017/sugaku-1a_mondai_0.html","問題"]]},
    "2017||center-main||現代社会":{"解答":[["https://www.toshin.com/center/2017/a/g-shakai_ans.pdf","解答"]]},
    "2017||center-main||生物":{"解答":[["https://www.toshin.com/center/2017/a/seibutsu_ans.pdf","解答"]]},
    "2017||center-main||英語（リーディング）":{"問題":[["https://www.toshin.com/center/2017/eigo_mondai_0.html","問題"]]},
    "2018||center-main||倫理":{"問題":[["https://www.toshin.com/center/2018/rinri_mondai_0.html","問題"]]},
    "2018||center-main||倫理，政治・経済":{"問題":[["https://www.toshin.com/center/2018/rinri_seikei_mondai_0.html","問題"]],"解答":[["https://www.toshin.com/center/2018/rinri_seikei_ans.html","解答"]]},
    "2018||center-main||化学基礎":{"問題":[["https://www.toshin.com/center/2018/kagaku-kiso_mondai_0.html","問題"]]},
    "2018||center-main||国語":{"問題":[["https://www.toshin.com/center/2018/kokugo_mondai_0.html","問題"]]},
    "2018||center-main||地学基礎":{"解答":[["https://www.toshin.com/center/2018/chigaku-kiso_ans.html","解答"]]},
    "2018||center-main||地理B":{"問題":[["https://www.toshin.com/center/2018/chiri-b_mondai_0.html","問題"]]},
    "2018||center-main||政治・経済":{"問題":[["https://www.toshin.com/center/2018/s-keizai_mondai_0.html","問題"]]},
    "2018||center-main||数学Ⅰ・数学A":{"問題":[["https://www.toshin.com/center/2018/sugaku-1a_mondai_0.html","問題"]]},
    "2018||center-main||数学Ⅱ・数学B":{"問題":[["https://www.toshin.com/center/2018/sugaku-2b_mondai_0.html","問題"]]},
    "2018||center-main||日本史B":{"問題":[["https://www.toshin.com/center/2018/q/nihonshi-b.pdf","問題"]],"解答":[["https://www.toshin.com/center/2018/a/nihonshi-b_ans.pdf","解答"]]},
    "2018||center-main||物理":{"問題":[["https://www.toshin.com/center/2018/butsuri_mondai_0.html","問題"]]},
    "2018||center-main||物理基礎":{"問題":[["https://www.toshin.com/center/2018/butsuri-kiso_mondai_0.html","問題"]]},
    "2018||center-main||現代社会":{"問題":[["https://www.toshin.com/center/2018/g-shakai_mondai_0.html","問題"]]},
    "2018||center-main||生物":{"問題":[["https://www.toshin.com/center/2018/seibutsu_mondai_0.html","問題"]]},
    "2018||center-main||生物基礎":{"問題":[["https://www.toshin.com/center/2018/seibutsu-kiso_mondai_0.html","問題"]]},
    "2018||center-main||英語（リスニング）":{"解答":[["https://www.toshin.com/center/2018/listning_ans.html","解答"]]},
    "2018||center-main||英語（リーディング）":{"問題":[["https://www.toshin.com/center/2018/eigo_mondai_0.html","問題"]]},
    "2019||center-main||世界史B":{"問題":[["https://www.toshin.com/center/2019/sekaishi-b_mondai_0.html","問題"]],"解答":[["https://www.toshin.com/center/2019/sekaishi-b_ans.html","解答"]]},
    "2019||center-main||倫理":{"問題":[["https://www.toshin.com/center/2019/rinri_mondai_0.html","問題"]]},
    "2019||center-main||倫理，政治・経済":{"問題":[["https://www.toshin.com/center/2019/rinri_seikei_mondai_0.html","問題"]],"解答":[["https://www.toshin.com/center/2019/rinri_seikei_ans.html","解答"]]},
    "2019||center-main||化学":{"問題":[["https://www.toshin.com/center/2019/kagaku_mondai_0.html","問題"]]},
    "2019||center-main||化学基礎":{"問題":[["https://www.toshin.com/center/2019/kagaku-kiso_mondai_0.html","問題"]]},
    "2019||center-main||国語":{"問題":[["https://www.toshin.com/center/2019/kokugo_mondai_0.html","問題"]]},
    "2019||center-main||地学":{"問題":[["https://www.toshin.com/center/2019/chigaku_mondai_0.html","問題"]]},
    "2019||center-main||地学基礎":{"問題":[["https://www.toshin.com/center/2019/chigaku-kiso_mondai_0.html","問題"]],"解答":[["https://www.toshin.com/center/2019/chigaku-kiso_ans.html","解答"]]},
    "2019||center-main||地理A":{"問題":[["https://www.toshin.com/center/2019/chiri-a_mondai_0.html","問題"]],"解答":[["https://www.toshin.com/center/2019/chiri-a_ans.html","解答"]]},
    "2019||center-main||地理B":{"問題":[["https://www.toshin.com/center/2019/chiri-b_mondai_0.html","問題"]],"解答":[["https://www.toshin.com/center/2019/chiri-b_ans.html","解答"]]},
    "2019||center-main||政治・経済":{"問題":[["https://www.toshin.com/center/2019/s-keizai_mondai_0.html","問題"]]},
    "2019||center-main||数学Ⅰ":{"問題":[["https://www.toshin.com/center/2019/sugaku-1_mondai_0.html","問題"]]},
    "2019||center-main||数学Ⅱ":{"問題":[["https://www.toshin.com/center/2019/q/sugaku-2.pdf","問題"]],"解答":[["https://www.toshin.com/center/2019/a/sugaku-2_ans.pdf","解答"]]},
    "2019||center-main||数学Ⅱ・数学B":{"問題":[["https://www.toshin.com/center/2019/q/sugaku-2b.pdf","問題"]]},
    "2019||center-main||日本史A":{"問題":[["https://www.toshin.com/center/2019/q/nihonshi-a.pdf","問題"]],"解答":[["https://www.toshin.com/center/2019/nihonshi-a_ans.html","解答"]]},
    "2019||center-main||日本史B":{"問題":[["https://www.toshin.com/center/2019/nihonshi-b_mondai_0.html","問題"]]},
    "2019||center-main||物理":{"問題":[["https://www.toshin.com/center/2019/butsuri_mondai_0.html","問題"]]},
    "2019||center-main||物理基礎":{"問題":[["https://www.toshin.com/center/2019/butsuri-kiso_mondai_0.html","問題"]],"解答":[["https://www.toshin.com/center/2019/butsuri-kiso_ans.html","解答"]]},
    "2019||center-main||現代社会":{"問題":[["https://www.toshin.com/center/2019/g-shakai_mondai_0.html","問題"]]},
    "2019||center-main||生物":{"問題":[["https://www.toshin.com/center/2019/seibutsu_mondai_0.html","問題"]],"解答":[["https://www.toshin.com/center/2019/seibutsu_ans.html","解答"]]},
    "2019||center-main||生物基礎":{"問題":[["https://www.toshin.com/center/2019/seibutsu-kiso_mondai_0.html","問題"]],"解答":[["https://www.toshin.com/center/2019/seibutsu-kiso_ans.html","解答"]]},
    "2019||center-main||英語（リスニング）":{"問題":[["https://www.toshin.com/center/2019/listning_mondai_0.html","問題"]]},
    "2019||center-main||英語（リーディング）":{"問題":[["https://www.toshin.com/center/2019/eigo_mondai_0.html","問題"]]},
    "2021||main||世界史A":{"問題":[["https://www.toshin.com/kyotsutest/2021/sekaishi-a_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2021/analysis_sekaishi-a.html","設問別分析"]]},
    "2021||main||世界史B":{"解説":[["https://www.toshin.com/kyotsutest/2021/data/442/sekaishi-b.pdf","解説"]]},
    "2021||main||倫理":{"問題":[["https://www.toshin.com/kyotsutest/2021/rinri_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2021/data/446/rinri.pdf","解説"]]},
    "2021||main||倫理，政治・経済":{"問題":[["https://www.toshin.com/kyotsutest/2021/rinri_seikei_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2021/data/445/rinri_seikei.pdf","解説"]]},
    "2021||main||化学":{"問題":[["https://www.toshin.com/kyotsutest/2021/kagaku_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2021/data/436/kagaku.pdf","解説"]]},
    "2021||main||化学基礎":{"問題":[["https://www.toshin.com/kyotsutest/2021/kagaku-kiso_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2021/data/437/kagaku-kiso.pdf","解説"]]},
    "2021||main||国語":{"問題":[["https://www.toshin.com/kyotsutest/2021/kokugo_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2021/data/449/kobunn.pdf","解説（古典）"],["https://www.toshin.com/kyotsutest/2021/analysis_kokugo.html","設問別分析"]]},
    "2021||main||地学":{"問題":[["https://www.toshin.com/kyotsutest/2021/chigaku_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2021/data/434/chigaku.pdf","解説"]]},
    "2021||main||地学基礎":{"問題":[["https://www.toshin.com/kyotsutest/2021/chigaku-kiso_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2021/data/435/chigaku-kiso.pdf","解説"]]},
    "2021||main||地理A":{"問題":[["https://www.toshin.com/kyotsutest/2021/chiri-a_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2021/analysis_chiri-a.html","設問別分析"]]},
    "2021||main||地理B":{"解説":[["https://www.toshin.com/kyotsutest/2021/data/444/chiri-b.pdf","解説"]]},
    "2021||main||政治・経済":{"問題":[["https://www.toshin.com/kyotsutest/2021/s-keizai_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2021/data/443/s-keizai.pdf","解説"]]},
    "2021||main||数学Ⅰ":{"問題":[["https://www.toshin.com/kyotsutest/2021/suugaku-1_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2021/analysis_suugaku-1.html","設問別分析"]]},
    "2021||main||数学Ⅰ・数学A":{"問題":[["https://www.toshin.com/kyotsutest/2021/suugaku-1a_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2021/data/447/suugaku-1a.pdf","解説"]]},
    "2021||main||数学Ⅱ":{"問題":[["https://www.toshin.com/kyotsutest/2021/suugaku2_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2021/analysis_suugaku2.html","設問別分析"]]},
    "2021||main||数学Ⅱ・数学B":{"問題":[["https://www.toshin.com/kyotsutest/2021/suugaku2b_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2021/data/448/suugaku-2b.pdf","解説"]]},
    "2021||main||日本史A":{"問題":[["https://www.toshin.com/kyotsutest/2021/nihonshi-a_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2021/analysis_nihonshi-a.html","設問別分析"]]},
    "2021||main||日本史B":{"問題":[["https://www.toshin.com/kyotsutest/2021/nihonshi-b_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2021/data/440/nihonshi-b.pdf","解説"]]},
    "2021||main||物理":{"問題":[["https://www.toshin.com/kyotsutest/2021/butsuri_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2021/data/432/butsuri.pdf","解説"]]},
    "2021||main||物理基礎":{"問題":[["https://www.toshin.com/kyotsutest/2021/butsuri-kiso_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2021/data/433/butsuri-kiso.pdf","解説"]]},
    "2021||main||現代社会":{"問題":[["https://www.toshin.com/kyotsutest/2021/g-shakai_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2021/data/441/g-shakai.pdf","解説"]]},
    "2021||main||生物":{"問題":[["https://www.toshin.com/kyotsutest/2021/seibutsu_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2021/data/438/seibutsu.pdf","解説"]]},
    "2021||main||生物基礎":{"問題":[["https://www.toshin.com/kyotsutest/2021/seibutsu-kiso_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2021/data/439/seibutsu-kiso.pdf","解説"]]},
    "2021||main||英語（リスニング）":{"問題":[["https://www.toshin.com/kyotsutest/2021/listening_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2021/data/430/listening.pdf","解説"]]},
    "2021||main||英語（リーディング）":{"解説":[["https://www.toshin.com/kyotsutest/2021/data/429/reading.pdf","解説"]]},
    "2022||main||世界史A":{"問題":[["https://www.toshin.com/kyotsutest/2022/sekaishi-a_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2022/analysis_sekaishi-a.html","設問別分析"]]},
    "2022||main||世界史B":{"問題":[["https://www.toshin.com/kyotsutest/2022/sekaishi-b_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2022/data/635/sekaishi-b.pdf","解説"]]},
    "2022||main||倫理":{"問題":[["https://www.toshin.com/kyotsutest/2022/rinri_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2022/data/639/rinri.pdf","解説"]]},
    "2022||main||倫理，政治・経済":{"問題":[["https://www.toshin.com/kyotsutest/2022/rinri_seikei_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2022/data/641/rinri-seikei.pdf","解説"]]},
    "2022||main||化学":{"問題":[["https://www.toshin.com/kyotsutest/2022/kagaku_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2022/data/632/kagaku.pdf","解説"]]},
    "2022||main||化学基礎":{"問題":[["https://www.toshin.com/kyotsutest/2022/kagaku-kiso_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2022/data/649/kagaku-kiso.pdf","解説"]]},
    "2022||main||国語":{"問題":[["https://www.toshin.com/kyotsutest/2022/kokugo_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2022/data/643/kobunn.pdf","解説（古典）"],["https://www.toshin.com/kyotsutest/2022/analysis_kokugo.html","設問別分析"]]},
    "2022||main||地学":{"問題":[["https://www.toshin.com/kyotsutest/2022/chigaku_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2022/data/634/chigaku.pdf","解説"]]},
    "2022||main||地学基礎":{"問題":[["https://www.toshin.com/kyotsutest/2022/chigaku-kiso_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2022/data/629/chigaku-kiso.pdf","解説"]]},
    "2022||main||地理A":{"解説":[["https://www.toshin.com/kyotsutest/2022/analysis_chiri-a.html","設問別分析"]]},
    "2022||main||地理B":{"解説":[["https://www.toshin.com/kyotsutest/2022/data/637/chiri-b.pdf","解説"]]},
    "2022||main||政治・経済":{"問題":[["https://www.toshin.com/kyotsutest/2022/s-keizai_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2022/data/640/s-keizai.pdf","解説"]]},
    "2022||main||数学Ⅰ":{"解説":[["https://www.toshin.com/kyotsutest/2022/analysis_suugaku-1.html","設問別分析"]]},
    "2022||main||数学Ⅰ・数学A":{"解説":[["https://www.toshin.com/kyotsutest/2022/data/630/sugaku-1a.pdf","解説"]]},
    "2022||main||数学Ⅱ":{"問題":[["https://www.toshin.com/kyotsutest/2022/suugaku2_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2022/analysis_suugaku2.html","設問別分析"]]},
    "2022||main||数学Ⅱ・数学B":{"問題":[["https://www.toshin.com/kyotsutest/2022/suugaku2b_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2022/data/646/sugaku-2b.pdf","解説"]]},
    "2022||main||日本史A":{"解説":[["https://www.toshin.com/kyotsutest/2022/analysis_nihonshi-a.html","設問別分析"]]},
    "2022||main||日本史B":{"問題":[["https://www.toshin.com/kyotsutest/2022/nihonshi-b_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2022/data/636/nihonshi-b.pdf","解説"]]},
    "2022||main||物理":{"問題":[["https://www.toshin.com/kyotsutest/2022/butsuri_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2022/data/631/butsuri.pdf","解説"]]},
    "2022||main||物理基礎":{"問題":[["https://www.toshin.com/kyotsutest/2022/butsuri-kiso_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2022/data/648/butsuri-kiso.pdf","解説"]]},
    "2022||main||現代社会":{"問題":[["https://www.toshin.com/kyotsutest/2022/g-shakai_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2022/data/638/g-shakai.pdf","解説"]]},
    "2022||main||生物":{"問題":[["https://www.toshin.com/kyotsutest/2022/seibutsu_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2022/data/633/seibutsu.pdf","解説"]]},
    "2022||main||生物基礎":{"解説":[["https://www.toshin.com/kyotsutest/2022/data/652/seibutsu-kiso.pdf","解説"]]},
    "2022||main||英語（リスニング）":{"問題":[["https://www.toshin.com/kyotsutest/2022/listening_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2022/data/645/listening.pdf","解説"]]},
    "2022||main||英語（リーディング）":{"問題":[["https://www.toshin.com/kyotsutest/2022/reading_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2022/data/647/eigo.pdf","解説"]]},
    "2023||main||世界史A":{"問題":[["https://www.toshin.com/kyotsutest/2023/sekaishi-a_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/answer_sekaishi-a.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/analysis_sekaishi-a.html","設問別分析"]]},
    "2023||main||世界史B":{"問題":[["https://www.toshin.com/kyotsutest/2023/sekaishi-b_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/answer_sekaishi-b.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/data/1675/sekaishi-b.pdf","解説"]]},
    "2023||main||倫理":{"解答":[["https://www.toshin.com/kyotsutest/2023/answer_rinri.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/data/1669/rinri.pdf","解説"]]},
    "2023||main||倫理，政治・経済":{"問題":[["https://www.toshin.com/kyotsutest/2023/rinri_seikei_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/answer_rinri_seikei.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/data/1671/rinri-seikei.pdf","解説"]]},
    "2023||main||化学":{"問題":[["https://www.toshin.com/kyotsutest/2023/kagaku_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/answer_kagaku.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/data/1677/kagaku.pdf","解説"]]},
    "2023||main||化学基礎":{"問題":[["https://www.toshin.com/kyotsutest/2023/kagaku-kiso_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/answer_kagaku-kiso.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/data/1676/kagaku-kiso.pdf","解説"]]},
    "2023||main||国語":{"問題":[["https://www.toshin.com/kyotsutest/2023/kokugo_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/answer_kokugo.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/data/1667/kobunn.pdf","解説（古典）"],["https://www.toshin.com/kyotsutest/2023/data/1665/kokugo_gendai.pdf","解説（現代文）"]]},
    "2023||main||地学":{"問題":[["https://www.toshin.com/kyotsutest/2023/chigaku_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/answer_chigaku.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/data/1672/chigaku.pdf","解説"]]},
    "2023||main||地学基礎":{"問題":[["https://www.toshin.com/kyotsutest/2023/chigaku-kiso_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/answer_chigaku-kiso.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/data/1659/chigaku-kiso.pdf","解説"]]},
    "2023||main||地理A":{"問題":[["https://www.toshin.com/kyotsutest/2023/chiri-a_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/answer_chiri-a.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/analysis_chiri-a.html","設問別分析"]]},
    "2023||main||地理B":{"解答":[["https://www.toshin.com/kyotsutest/2023/answer_chiri-b.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/data/1673/chiri-b.pdf","解説"]]},
    "2023||main||政治・経済":{"問題":[["https://www.toshin.com/kyotsutest/2023/s-keizai_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/answer_s-keizai.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/data/1668/s-keizai.pdf","解説"]]},
    "2023||main||数学Ⅰ":{"問題":[["https://www.toshin.com/kyotsutest/2023/suugaku-1_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2023/analysis_suugaku-1.html","設問別分析"]]},
    "2023||main||数学Ⅰ・数学A":{"問題":[["https://www.toshin.com/kyotsutest/2023/suugaku-1a_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2023/data/1660/suugaku-1a.pdf","解説"]]},
    "2023||main||数学Ⅱ":{"問題":[["https://www.toshin.com/kyotsutest/2023/suugaku2_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2023/analysis_suugaku2.html","設問別分析"]]},
    "2023||main||数学Ⅱ・数学B":{"問題":[["https://www.toshin.com/kyotsutest/2023/suugaku2b_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2023/data/1662/suugaku2b.pdf","解説"]]},
    "2023||main||日本史A":{"問題":[["https://www.toshin.com/kyotsutest/2023/nihonshi-a_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/answer_nihonshi-a.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/analysis_nihonshi-a.html","設問別分析"]]},
    "2023||main||日本史B":{"問題":[["https://www.toshin.com/kyotsutest/2023/nihonshi-b_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/answer_nihonshi-b.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/data/1674/nihonshi-b.pdf","解説"]]},
    "2023||main||物理":{"解答":[["https://www.toshin.com/kyotsutest/2023/answer_butsuri.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/data/1664/butsuri.pdf","解説"]]},
    "2023||main||物理基礎":{"問題":[["https://www.toshin.com/kyotsutest/2023/butsuri-kiso_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/answer_butsuri-kiso.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/analysis_butsuri-kiso.html","設問別分析"]]},
    "2023||main||現代社会":{"問題":[["https://www.toshin.com/kyotsutest/2023/g-shakai_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/answer_g-shakai.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/data/1663/g-shakai.pdf","解説"]]},
    "2023||main||生物":{"問題":[["https://www.toshin.com/kyotsutest/2023/seibutsu_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2023/answer_seibutsu.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/data/1670/seibutsu.pdf","解説"]]},
    "2023||main||生物基礎":{"解答":[["https://www.toshin.com/kyotsutest/2023/answer_seibutsu-kiso.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2023/data/1658/seibutsu-kiso.pdf","解説"]]},
    "2023||main||英語（リスニング）":{"問題":[["https://www.toshin.com/kyotsutest/2023/listening_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2023/data/1661/listening.pdf","解説"]]},
    "2023||main||英語（リーディング）":{"問題":[["https://www.toshin.com/kyotsutest/2023/reading_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2023/data/1656/eigo.pdf","解説"]]},
    "2024||main||世界史A":{"問題":[["https://www.toshin.com/kyotsutest/2024/sekaishi-a_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2024/analysis_sekaishi-a.html","設問別分析"]]},
    "2024||main||世界史B":{"問題":[["https://www.toshin.com/kyotsutest/2024/sekaishi-b_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2024/data/2289/sekaishi-b.pdf","解説"]]},
    "2024||main||倫理":{"問題":[["https://www.toshin.com/kyotsutest/2024/rinri_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2024/data/2291/rinri.pdf","解説"]]},
    "2024||main||倫理，政治・経済":{"問題":[["https://www.toshin.com/kyotsutest/2024/rinri_seikei_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2024/data/2292/rinri_seikei.pdf","解説"]]},
    "2024||main||化学":{"問題":[["https://www.toshin.com/kyotsutest/2024/kagaku_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2024/data/2298/kagaku.pdf","解説"]]},
    "2024||main||化学基礎":{"問題":[["https://www.toshin.com/kyotsutest/2024/kagaku-kiso_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2024/data/2293/kagaku-kiso.pdf","解説"]]},
    "2024||main||国語":{"解説":[["https://www.toshin.com/kyotsutest/2024/data/2286/kokugo_koten.pdf","解説（古典）"],["https://www.toshin.com/kyotsutest/2024/data/2287/kokugo_gendaibun.pdf","解説（現代文）"]]},
    "2024||main||地学":{"問題":[["https://www.toshin.com/kyotsutest/2024/chigaku_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2024/data/2285/chigaku.pdf","解説"]]},
    "2024||main||地学基礎":{"問題":[["https://www.toshin.com/kyotsutest/2024/chigaku-kiso_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2024/data/2284/chigaku-kiso.pdf","解説"]]},
    "2024||main||地理A":{"問題":[["https://www.toshin.com/kyotsutest/2024/chiri-a_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2024/analysis_chiri-a.html","設問別分析"]]},
    "2024||main||地理B":{"問題":[["https://www.toshin.com/kyotsutest/2024/chiri-b_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2024/data/2282/chiri-b.pdf","解説"]]},
    "2024||main||政治・経済":{"解説":[["https://www.toshin.com/kyotsutest/2024/data/2290/s-keizai.pdf","解説"]]},
    "2024||main||数学Ⅰ":{"問題":[["https://www.toshin.com/kyotsutest/2024/suugaku-1_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2024/analysis_suugaku-1.html","設問別分析"]]},
    "2024||main||数学Ⅰ・数学A":{"問題":[["https://www.toshin.com/kyotsutest/2024/suugaku-1a_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2024/data/2280/suugaku-1a.pdf","解説"]]},
    "2024||main||数学Ⅱ":{"問題":[["https://www.toshin.com/kyotsutest/2024/suugaku2_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2024/analysis_suugaku2.html","設問別分析"]]},
    "2024||main||数学Ⅱ・数学B":{"問題":[["https://www.toshin.com/kyotsutest/2024/suugaku2b_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2024/data/2281/suugaku2b.pdf","解説"]]},
    "2024||main||日本史A":{"問題":[["https://www.toshin.com/kyotsutest/2024/nihonshi-a_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2024/analysis_nihonshi-a.html","設問別分析"]]},
    "2024||main||日本史B":{"問題":[["https://www.toshin.com/kyotsutest/2024/nihonshi-b_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2024/data/2283/nihonshi-b.pdf","解説"]]},
    "2024||main||物理":{"解説":[["https://www.toshin.com/kyotsutest/2024/data/2296/butsuri.pdf","解説"]]},
    "2024||main||物理基礎":{"問題":[["https://www.toshin.com/kyotsutest/2024/butsuri-kiso_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2024/analysis_butsuri-kiso.html","設問別分析"]]},
    "2024||main||現代社会":{"問題":[["https://www.toshin.com/kyotsutest/2024/g-shakai_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2024/data/2288/g-shakai.pdf","解説"]]},
    "2024||main||生物":{"問題":[["https://www.toshin.com/kyotsutest/2024/seibutsu_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2024/data/2294/seibutsu.pdf","解説"]]},
    "2024||main||生物基礎":{"問題":[["https://www.toshin.com/kyotsutest/2024/seibutsu-kiso_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2024/data/2295/seibutsu-kiso.pdf","解説"]]},
    "2024||main||英語（リーディング）":{"問題":[["https://www.toshin.com/kyotsutest/2024/reading_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2024/data/2278/reading.pdf","解説"]]},
    "2025||main||公共":{"問題":[["https://www.toshin.com/kyotsutest/2025/koukyou_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2025/data/3115/koukyo.pdf","解説"]]},
    "2025||main||公共，倫理":{"解説":[["https://www.toshin.com/kyotsutest/2025/data/3121/koukyo-rinri.pdf","解説"]]},
    "2025||main||公共，政治・経済":{"解説":[["https://www.toshin.com/kyotsutest/2025/data/3122/koukyo-seikei.pdf","解説"]]},
    "2025||main||化学":{"問題":[["https://www.toshin.com/kyotsutest/2025/kagaku_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2025/answer_kagaku.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2025/data/3127/kagaku.pdf","解説"]]},
    "2025||main||化学基礎":{"問題":[["https://www.toshin.com/kyotsutest/2025/kagaku-kiso_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2025/data/3129/kagakukiso.pdf","解説"]]},
    "2025||main||国語":{"問題":[["https://www.toshin.com/kyotsutest/2025/kokugo_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2025/data/3120/koten.pdf","解説（古典）"],["https://www.toshin.com/kyotsutest/2025/data/3118/gendaibun.pdf","解説（現代文）"]]},
    "2025||main||地学":{"問題":[["https://www.toshin.com/kyotsutest/2025/chigaku_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2025/data/3126/chigaku.pdf","解説"]]},
    "2025||main||地学基礎":{"問題":[["https://www.toshin.com/kyotsutest/2025/chigaku-kiso_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2025/data/3124/chigakukiso.pdf","解説"]]},
    "2025||main||地理総合":{"問題":[["https://www.toshin.com/kyotsutest/2025/tiri_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2025/data/3132/tirisougou.pdf","解説"]]},
    "2025||main||地理総合，地理探究":{"解説":[["https://www.toshin.com/kyotsutest/2025/data/3130/tiri-tankyu.pdf","解説"]]},
    "2025||main||情報Ⅰ":{"問題":[["https://www.toshin.com/kyotsutest/2025/jouhou1_question_0.html","問題"]],"解答":[["https://www.toshin.com/kyotsutest/2025/answer_jouhou1.html","解答"]],"解説":[["https://www.toshin.com/kyotsutest/2025/data/3117/jouhou-1.pdf","解説"]]},
    "2025||main||数学Ⅰ":{"問題":[["https://www.toshin.com/kyotsutest/2025/suugaku-1_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2025/analysis_suugaku-1.html","設問別分析"]]},
    "2025||main||数学Ⅰ，数学A":{"問題":[["https://www.toshin.com/kyotsutest/2025/suugaku-1a_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2025/data/3133/suugaku-1A.pdf","解説"]]},
    "2025||main||数学Ⅱ，数学B，数学C":{"問題":[["https://www.toshin.com/kyotsutest/2025/suugaku2bc_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2025/data/3112/suugaku-2bc.pdf","解説"]]},
    "2025||main||歴史総合":{"問題":[["https://www.toshin.com/kyotsutest/2025/rekishi_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2025/data/3134/rekishisougou.pdf","解説"]]},
    "2025||main||歴史総合，世界史探究":{"問題":[["https://www.toshin.com/kyotsutest/2025/rekishi-sekaishi_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2025/data/3116/sekaishi-tankyu.pdf","解説"]]},
    "2025||main||歴史総合，日本史探究":{"解説":[["https://www.toshin.com/kyotsutest/2025/data/3123/nihonshi-tankyu.pdf","解説"]]},
    "2025||main||物理":{"解説":[["https://www.toshin.com/kyotsutest/2025/data/3119/butsuri.pdf","解説"]]},
    "2025||main||物理基礎":{"解説":[["https://www.toshin.com/kyotsutest/2025/data/3114/butsurikiso.pdf","解説"]]},
    "2025||main||生物":{"解説":[["https://www.toshin.com/kyotsutest/2025/analysis_seibutsu.html","設問別分析"]]},
    "2025||main||生物基礎":{"解説":[["https://www.toshin.com/kyotsutest/2025/data/3125/seibutsukiso.pdf","解説"]]},
    "2025||main||英語（リスニング）":{"問題":[["https://www.toshin.com/kyotsutest/2025/listening_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2025/data/3131/listening.pdf","解説"]]},
    "2025||main||英語（リーディング）":{"問題":[["https://www.toshin.com/kyotsutest/2025/reading_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/2025/data/3113/reading.pdf","解説"]]},
    "2026||main||公共":{"問題":[["https://www.toshin.com/kyotsutest/koukyou_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/data/3750/koukyo.pdf","解説"]]},
    "2026||main||公共，倫理":{"解説":[["https://www.toshin.com/kyotsutest/data/3743/koukyo-rinri.pdf","解説"]]},
    "2026||main||公共，政治・経済":{"問題":[["https://www.toshin.com/kyotsutest/koukyou-keizai_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/data/3745/koukyo-seikei.pdf","解説"]]},
    "2026||main||化学":{"問題":[["https://www.toshin.com/kyotsutest/kagaku_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/data/3747/kagaku.pdf","解説"]]},
    "2026||main||化学基礎":{"問題":[["https://www.toshin.com/kyotsutest/kagaku-kiso_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/data/3744/kagaku-kiso.pdf","解説"]]},
    "2026||main||国語":{"問題":[["https://www.toshin.com/kyotsutest/kokugo_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/data/3754/koten.pdf","解説（古典）"],["https://www.toshin.com/kyotsutest/analysis_kokugo.html","設問別分析"]]},
    "2026||main||地学":{"問題":[["https://www.toshin.com/kyotsutest/chigaku_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/data/3751/tigaku.pdf","解説"]]},
    "2026||main||地学基礎":{"問題":[["https://www.toshin.com/kyotsutest/chigaku-kiso_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/data/3749/tigaku-kiso.pdf","解説"]]},
    "2026||main||地理総合":{"問題":[["https://www.toshin.com/kyotsutest/tiri_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/data/3746/tirisougou.pdf","解説"]]},
    "2026||main||地理総合，地理探究":{"解説":[["https://www.toshin.com/kyotsutest/data/3740/tiri-tankyu.pdf","解説"]]},
    "2026||main||情報Ⅰ":{"問題":[["https://www.toshin.com/kyotsutest/jouhou1_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/data/3763/jouhou-1.pdf","解説"]]},
    "2026||main||数学Ⅰ":{"問題":[["https://www.toshin.com/kyotsutest/suugaku-1_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/analysis_suugaku-1.html","設問別分析"]]},
    "2026||main||数学Ⅰ，数学A":{"問題":[["https://www.toshin.com/kyotsutest/suugaku-1a_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/data/3759/sugaku-1a.pdf","解説"]]},
    "2026||main||数学Ⅱ，数学B，数学C":{"問題":[["https://www.toshin.com/kyotsutest/suugaku2bc_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/data/3760/sugaku-2bc.pdf","解説"]]},
    "2026||main||歴史総合":{"解説":[["https://www.toshin.com/kyotsutest/data/3748/rekishisougou.pdf","解説"]]},
    "2026||main||歴史総合，世界史探究":{"解説":[["https://www.toshin.com/kyotsutest/data/3742/sekaishi-tankyu.pdf","解説"]]},
    "2026||main||歴史総合，日本史探究":{"問題":[["https://www.toshin.com/kyotsutest/rekishi-nihonshi_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/data/3741/nihonshi-tankyu.pdf","解説"]]},
    "2026||main||物理":{"解説":[["https://www.toshin.com/kyotsutest/data/3758/butsuri.pdf","解説"]]},
    "2026||main||物理基礎":{"問題":[["https://www.toshin.com/kyotsutest/butsuri-kiso_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/data/3757/butsuri-kiso.pdf","解説"]]},
    "2026||main||生物":{"問題":[["https://www.toshin.com/kyotsutest/seibutsu_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/data/3762/seibutsu.pdf","解説"]]},
    "2026||main||生物基礎":{"問題":[["https://www.toshin.com/kyotsutest/seibutsu-kiso_question_0.html","問題"]],"解説":[["https://www.toshin.com/kyotsutest/data/3761/seibutsu-kiso.pdf","解説"]]},
    "2026||main||英語（リスニング）":{"解説":[["https://www.toshin.com/kyotsutest/data/3756/listening.pdf","解説"]]},
    "2026||main||英語（リーディング）":{"解説":[["https://www.toshin.com/kyotsutest/data/3755/reading.pdf","解説"]]},
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
    const verified=VERIFIED_SOURCE_LINKS[keySignature(k)]||{};
    const appendLinks=(kind,fallback)=>{
      const items=verified[kind]||(fallback?[[fallback,kind]]:[]);
      items.forEach(([url,label])=>links.push(`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`));
    };
    const answerUrl=verified['解答']?verified['解答'][0][0]:(k.answerPdfUrl||k.sourceUrl);
    appendLinks('解答',answerUrl);
    if(k.sourcePageUrl&&k.sourcePageUrl!==answerUrl) links.push(`<a href="${esc(k.sourcePageUrl)}" target="_blank" rel="noopener noreferrer">掲載ページ</a>`);
    appendLinks('問題',k.problemUrl);
    appendLinks('解説',k.explanationSourceUrl);
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

