const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// 네이버 ID 설정
const NAVER_ID = 'kj1nhon9o114';

// [기능 1] 리다이렉트 중계소 (/go)
app.get('/go', (req, res) => {
    const destination = req.query.url;
    
    // 목적지가 없으면 그냥 홈으로
    if (!destination) {
        return res.redirect('/');
    }
    
    // 진짜 목적지로 점프 (301: 영구 이동)
    res.redirect(301, destination);
});

// [기능 2] RSS 변환기 (/naver/rss)
app.get('/naver/rss', async (req, res) => {
    const TARGET_RSS_URL = `https://rss.blog.naver.com/${NAVER_ID}.xml`;
    
    // Render가 제공하는 내 서버 주소 (자동 감지)
    // 로컬 테스트일 땐 localhost, 배포하면 onrender.com 주소
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers.host;
    const MY_DOMAIN = `${protocol}://${host}`;
    
    // 덮어씌울 내 주소 껍데기
    const WRAPPER = `${MY_DOMAIN}/go?url=`;

    try {
        const response = await fetch(TARGET_RSS_URL);
        if (!response.ok) throw new Error('Naver RSS Fetch Failed');

        let xmlData = await response.text();

        // 1. 기존에 꼬여있는 내 주소 껍데기 전부 벗기기 (청소)
        while (xmlData.includes(WRAPPER)) {
            xmlData = xmlData.replaceAll(WRAPPER, '');
        }

        // 2. 깨끗해진 네이버 주소에 딱 한 번만 껍데기 입히기
        xmlData = xmlData.replaceAll(
            'https://blog.naver.com', 
            `${WRAPPER}https://blog.naver.com`
        );

        // 3. XML 응답 보내기
        res.set('Content-Type', 'application/xml; charset=utf-8');
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate'); // 테스트용 캐시 끔
        res.send(xmlData);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
