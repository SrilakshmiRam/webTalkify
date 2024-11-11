const express=require('express')
const {open}=require('sqlite')
const sqlite3=require('sqlite3')
const app=express()
const cors=require('cors')
const bcrypt=require('bcryptjs')
const jwt=require('jsonwebtoken')

const path=require('path')

const dbPath=path.join(__dirname,'chatmate.db')

app.use(cors({
    origin:'http://localhost:3000',
    methods:['POST','GET'],
    allowedHeaders:['Content-Type','Authorization']
}))

app.use(express.json())

let db=null 

const initiateAndStartDatabaseServer=async()=>{
    try{
        db=await open({
            filename:dbPath,
            driver:sqlite3.Database
        })
        app.listen(3000,()=>{
            console.log('Backend Server is running at http://localhost:3000')
        })
    }catch (e){
        console.log(`DB Error: ${e.message}`)
        process.exit(1)
    }
}

initiateAndStartDatabaseServer()

console.log("Database path:", dbPath);


app.post('/login',async(req,res)=>{
    const {username,password}=req.body 
    try{
        const userSelectQuery=`select * from users where username=?;`
        const dbUser=await db.get(userSelectQuery,[username])
        if(dbUser===undefined){
           res.status(404).json({ message: 'Invalid username or password'})
        }
        else{
            const isPasswordMatched=await bcrypt.compare(password,dbUser.password)
            if (isPasswordMatched===true){
                const payload={username}
                const jwtToken=jwt.sign(payload,'my_secret_token')
                res.status(201).json({'jwt_token':jwtToken, userId:dbUser.id})
            }
            else{
                res.status(400).json({ message: 'Invalid username or password'})
            }
        }
    }catch (e){
        res.status(501).json({message:'internal server error', error: e.message})
    }
})



app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        console.log("Executing insert for:", username);

        const hashedPassword = await bcrypt.hash(password, 10);
        const userInsertQuery = `INSERT INTO users (username, email, password) VALUES (?, ?, ?);`;
        await db.run(userInsertQuery, [username, email, hashedPassword]);
        console.log("User registered with username:", username);

        res.status(201).json({ message: 'User registered successfully' });
    } catch (e) {
        res.status(400).json({ message: 'Failed to register user', error: e.message });
    }
});


app.get('/users',async(req,res)=>{
    try{
        const userQuery=`select * from users;`
        const response=await db.all(userQuery)
        res.status(201).json({data:response})
    }catch (e){
        console.log('error',e.message)
        res.status(501).json({message:'Failed to fetch the data', error:e.message})
    }
})