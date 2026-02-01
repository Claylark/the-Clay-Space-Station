export async function onRequestPost(context) {
    const { env, request } = context;
    const body = await request.json();
    const { query, context: pageContext, modelType } = body;

    // 预设系统提示词
    const systemPrompt = `你现在是"星壤空间站"的向导 ClaySeek。主人 Clay 17岁，南京高中生，ENFP... \n 页面内容：${pageContext}`;

    // --- 分流逻辑 ---
    
    // 1. 如果选择的是 豆包 (Ark)
    if (modelType === 'ark') {
        const ARK_URL = "https://ark.cn-beijing.volces.com/api/v3/chat/completions";
        const resp = await fetch(ARK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${env.ARK_API_KEY}`
            },
            body: JSON.stringify({
                model: env.ARK_ENDPOINT_ID,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: query }
                ]
            })
        });
        const data = await resp.json();
        return new Response(JSON.stringify({ reply: data.choices?.[0]?.message?.content }));
    }

    // 2. 如果选择的是 Gemini (默认)
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
    const resp = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: query }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] }
        })
    });
    const data = await resp.json();
    return new Response(JSON.stringify({ reply: data.candidates?.[0]?.content?.parts?.[0]?.text }));
}
