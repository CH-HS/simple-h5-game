
const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();
const port = 3000;

// MongoDB 连接
const mongoUrl = 'mongodb://localhost:27017';
const mongoClient = new MongoClient(mongoUrl);
const db = mongoClient.db('balloon-battle');
const playersCollection = db.collection('players');

// 解析 JSON 请求体
app.use(express.json());

// 登录
app.post('/login', async (req, res) => {
    const { account, password } = req.body;
    try {
        const player = await playersCollection.findOne({ account, password });
        if (!player) {
            return res.status(401).json({ message: '账号或密码错误' });
        }
        res.json({ highScore: player.highScore });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: '登录失败' });
    }
});

// 注册
app.post('/register', async (req, res) => {
    const { account, password } = req.body;
    try {
        const existingPlayer = await playersCollection.findOne({ account });
        if (existingPlayer) {
            return res.status(409).json({ message: '账号已存在' });
        }
        await playersCollection.insertOne({ account, password, highScore: 0 });
        res.status(201).json({ message: '注册成功' });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: '注册失败' });
    }
});

// 更新分数
app.post('/updateScore', async (req, res) => {
    const { account, score } = req.body;
    try {
        await playersCollection.updateOne({ account }, { $max: { highScore: score } });
        const player = await playersCollection.findOne({ account });
        res.json({ highScore: player.highScore });
    } catch (err) {
        console.error('Update score error:', err);
        res.status(500).json({ message: '更新分数失败' });
    }
});

// 获取排行榜
app.get('/leaderboard', async (req, res) => {
    try {
        const leaderboard = await playersCollection.find({}, { projection: { _id: 0, account: 1, highScore: 1 } })
            .sort({ highScore: -1 })
            .limit(10)
            .toArray();
        res.json(leaderboard);
    } catch (err) {
        console.error('Leaderboard error:', err);
        res.status(500).json({ message: '获取排行榜失败' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});