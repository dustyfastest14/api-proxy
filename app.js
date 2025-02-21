import http from 'http';
import https from "https";
import fs from "fs";
import app from './api/proxy.js';
import { URL } from 'url';

const PORT = process.env.PORT || 443;

// 证书路径
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CERT_CHAIN = process.env.CERT_CHAIN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// 证书
let credentials = null;
try {
    credentials = {
        key: fs.readFileSync(PRIVATE_KEY, 'utf8'),
        cert: fs.readFileSync(CERT_CHAIN, 'utf8')
    };
} catch (_) {
    console.log("No SSL certificate provided, using HTTP.");
}

const server = credentials ? https.createServer(credentials, app) : http.createServer(app);

server.listen(PORT, () => {
    console.log(`Proxy server is running on port ${PORT}`);
});

app.post('/api/proxy/openai', async (req, res) => {
    try {
        const targetURL = new URL('https://api.openai.com/v1/chat/completions'); // OpenAI API 端点 (假设为 chat completions)
        const apiKey = OPENAI_API_KEY;

        if (!apiKey) {
            return res.status(401).send('OpenAI API key is required.');
        }

        const proxyReq = https.request(targetURL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                ...req.headers,
                'Host': targetURL.host // 确保 Host 头正确
            },
            path: targetURL.pathname + targetURL.search
        }, proxyRes => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
        });

        proxyReq.on('error', (error) => {
            console.error('Proxy request error:', error);
            res.status(500).send('Proxy request failed.');
        });

        req.pipe(proxyReq);
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).send('Request processing error.');
    }
});

app.post('/api/proxy/google', async (req, res) => {
    try {
        const targetURL = new URL(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GOOGLE_API_KEY}`); // Google Gemini Pro API 端点
        const apiKey = GOOGLE_API_KEY; // 实际上 API Key 已经放在 URL 中了，这里为了保持一致性

        if (!apiKey) {
            return res.status(401).send('Google API key is required.');
        }

        const proxyReq = https.request(targetURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...req.headers,
                'Host': targetURL.host // 确保 Host 头正确
            },
            path: targetURL.pathname + targetURL.search
        }, proxyRes => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
        });

        proxyReq.on('error', (error) => {
            console.error('Proxy request error:', error);
            res.status(500).send('Proxy request failed.');
        });

        req.pipe(proxyReq);
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).send('Request processing error.');
    }
});

app.post('/api/proxy/anthropic', async (req, res) => {
    try {
        const targetURL = new URL('https://api.anthropic.com/v1/messages'); // Anthropic API 端点 (messages API)
        const apiKey = ANTHROPIC_API_KEY;

        if (!apiKey) {
            return res.status(401).send('Anthropic API key is required.');
        }

        const proxyReq = https.request(targetURL, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey, // Anthropic 使用 x-api-key header
                'anthropic-version': '2023-06-01', //  根据 README.md 添加 anthropic-version
                'content-type': 'application/json', // 根据 README.md 添加 content-type
                ...req.headers,
                'Host': targetURL.host // 确保 Host 头正确
            },
            path: targetURL.pathname + targetURL.search
        }, proxyRes => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
        });

        proxyReq.on('error', (error) => {
            console.error('Proxy request error:', error);
            res.status(500).send('Proxy request failed.');
        });

        req.pipe(proxyReq);
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).send('Request processing error.');
    }
});

app.post('/api/proxy/groq', async (req, res) => {
    try {
        const targetURL = new URL('https://api.groq.com/openai'); // Groq API 端点
        const apiKey = GROQ_API_KEY; // 使用 Groq API 密钥

        if (!apiKey) {
            return res.status(401).send('Groq API key is required.');
        }

        const proxyReq = https.request(targetURL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`, // 设置 Groq API 密钥
                'Content-Type': 'application/json',
                ...req.headers, // 传递其他请求头
                'Host': targetURL.host // 确保 Host 头正确
            },
            path: targetURL.pathname + targetURL.search
        }, proxyRes => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
        });

        proxyReq.on('error', (error) => {
            console.error('Proxy request error:', error);
            res.status(500).send('Proxy request failed.');
        });

        req.pipe(proxyReq); // 将客户端请求体传递给代理请求
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).send('Request processing error.');
    }
});
