const mongooose = require('mongoose');

module.exports = async function() {
    try{
        await mongooose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
             useUnifiedTopology: true, 
            useCreateIndex: true
        });
        console.log('Connected to MongoDB');
    }catch(e){
        console.log(e);
    
    }
}































