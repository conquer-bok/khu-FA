const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const methodOverride = require('method-override');
const fs = require('fs'); // 파일 시스템 모듈 추가

const app = express();

const cors = require('cors');
app.use(cors());

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB connection error:", err));

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// method-override 미들웨어 추가
app.use(methodOverride('_method'));

const postSchema = new mongoose.Schema({
    college: String,
    title: String,
    file: String,
    createdAt: { type: Date, default: Date.now }
});
const Post = mongoose.model('Post', postSchema);

app.get('/', async (req, res) => {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.render('index', { posts });
});

app.get('/new', (req, res) => {
    res.render('new');
});

app.post('/new', upload.single('file'), async (req, res) => {
    const newPost = new Post({
        college: req.body.college,
        title: req.body.title,
        file: req.file ? req.file.filename : null
    });
    await newPost.save();
    res.redirect('/');
});

app.get('/post/:id', async (req, res) => {
    const post = await Post.findById(req.params.id);
    res.render('post', { post });
});

// DELETE 라우트 - 파일도 함께 삭제
app.delete('/delete/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        
        // 파일이 존재하면 uploads 폴더에서 삭제
        if (post.file) {
            const filePath = path.join(__dirname, 'uploads', post.file);
            try {
                fs.unlinkSync(filePath); // 동기적으로 파일 삭제
                console.log(`파일 ${post.file} 삭제됨.`);
            } catch (err) {
                console.error(`파일 삭제 중 오류 발생: ${err}`);
            }
        }

        // 데이터베이스에서 게시물 삭제
        await Post.findByIdAndDelete(req.params.id);
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('게시물을 삭제하는 중 오류가 발생했습니다.');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://ksngee4:<@jb950405>@database.gu4px.mongodb.net/?retryWrites=true&w=majority&appName=database";
