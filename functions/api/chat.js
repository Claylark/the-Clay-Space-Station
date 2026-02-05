export async function onRequestPost(context) {
    const { env, request } = context;
    const body = await request.json();
    const { modelType, contents, messages } = body;

    // --- Gemini 转发逻辑 ---
    if (modelType === 'gemini') {
        const GEMINI_KEY = env.GEMINI_API_KEY;
        if (!GEMINI_KEY) return new Response(JSON.stringify({ error: "Gemini Key 未配置" }), { status: 500 });

        const model = "gemini-2.5-flash-preview-09-2025";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents, systemInstruction: body.systemInstruction })
            });
            const data = await response.json();
            return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
        } catch (e) {
            return new Response(JSON.stringify({ error: "Gemini 调用失败" }), { status: 500 });
        }
    }

    // --- 豆包 (Ark) 转发逻辑 ---
    if (modelType === 'ark') {
        const ARK_KEY = env.ARK_API_KEY;
        const ENDPOINT_ID = env.ARK_ENDPOINT_ID;
        if (!ARK_KEY || !ENDPOINT_ID) return new Response(JSON.stringify({ error: "Ark 配置不完整" }), { status: 500 });

        const url = `https://ark.cn-beijing.volces.com/api/v3/chat/completions`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ARK_KEY}`
                },
                body: JSON.stringify({ 
                    model: ENDPOINT_ID, 
                    messages: messages 
                })
            });
            const data = await response.json();
            return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
        } catch (e) {
            return new Response(JSON.stringify({ error: "Ark 调用失败" }), { status: 500 });
        }
    }

    return new Response(JSON.stringify({ error: "无效的模型类型" }), { status: 400 });
}
