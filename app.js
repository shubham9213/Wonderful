if(process.env.NODE_ENV!="production")
{
require("dotenv").config();

}
const express=require("express");
const app=express();
const path=require("path");
const ExpressError = require("./utils/ExpressError.js");

const mongoose=require("mongoose");
const methodOverride = require("method-override");
const ejsMate=require("ejs-mate");
const listings=require("./routes/listing.js");
const reviewRoute=require("./routes/review.js");
const userRoute=require("./routes/user.js");
const searchRoute=require("./routes/search.js");
const dburl=process.env.ATLASDB_URL;

const session=require("express-session");
const MongoStore=require("connect-mongo")
const flash=require("connect-flash");
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./Models/user.js");


//const dburl="mongodb://127.0.0.1:27017/wonderlust";

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));  
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));
app.use(express.json());

main()
.then(()=>{console.log("connect to database")})
.catch((err)=>{console.log("not conneted")});

async function main(){
    await mongoose.connect(dburl);
}
const store=MongoStore.create({
    mongoUrl:dburl,
    crypto:{
        secret:process.env.SECRET
    },
    touchAfter:24*3600,
})
store.on("error",(err)=>{
    console.log("error in mongostore",err);
});

const sessionOption={
    store,
    secret:process.env.SECRET,
    resave:false, saveUninitialized:false,
    cookie:{
    
    expires:Date.now()+7*24*60*60*1000,
    maxAge:7*24*60*60*1000,
    httpOnly:true
},};


app.use(session(sessionOption));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,resp,next)=>{
    resp.locals.error=req.flash("error");
    resp.locals.success=req.flash("success");
    resp.locals.currUser=req.user || null;
    
    next();
})




app.get('/favicon.ico', (req, res) => res.status(204).end());
app.use("/listing",listings)
app.use("/listing/:id/review",reviewRoute);
app.use("/",userRoute);
app.use("/search",searchRoute);

app.get("/privacy", (req, res) => {
  res.render("privacy.ejs"); // Render privacy policy page
});

app.get("/terms", (req, res) => {
  res.render("terms.ejs"); // Render terms and conditions page
});


app.get("/test-session", (req, res) => {
  req.session.test = "Session is working!";
  res.send("Session value set.");
});



app.all("*",(req,res,next)=>
    {
    next(new ExpressError(404,"page not found"))
})
app.use((err,req,res,next)=>{
    let{status=500,message="error"}=err;
    res.status(status).render("error.ejs",{message})
    // res.status(status).send(message);
})

app.listen(8080,()=>{console.log("server start")});
