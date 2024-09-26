const express = require('express');
const cors = require('cors');
require("dotenv").config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
// This is your test secret API key.
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000

//------MeddleWare--------
app.use(cors());
app.use(express.json());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8tunxxp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    //----------DataBase-----&-----Cullection--------?
    const menuCollection = client.db("food-delivery-1").collection("menus");
    const cartCollection = client.db("food-delivery-1").collection("cartItems");
    const userCullection = client.db('food-delivery-1').collection('users')
    const paymentCullection = client.db('food-delivery-1').collection('payments')
     
    //--------Verify------Token-----
    // const verifyToken = (req, res, next) => {
    //   if(!req.headers.authorization){
    //     return res.status(401).send({message: "umauthorized access"})
    //   }

    //   const token = req.headers.authorization.split('')[1];
    //   console.log(token);
    //   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    //     if(err){
    //       return res.status(401).send({message: "tokon is invalid!"})
    //     }
    //     req.decoded = decoded;
    //     next();
    //   });
    // }



    //------JWT-------Authantication-----------
    // app.post('/jwt', async(req, res) => {
    //   const user = req.body;
    //   const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    //     expiresIn: '1hr'
    //   });
    //   res.send({token})
    // })


   //============Menu==========Related==========Api===========
    //------All-------menu--------GET-------
    app.get("/menu", async(req, res) => {
        const cursor = menuCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    });

    //-------Single------Menu------GET--------
    app.get("/menu/:id", async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await menuCollection.findOne(query);
      res.send(result);
    });


    //--------Menu-------Item------Post--------
    app.post("/menu", async(req, res) => {
        const menu = req.body;
        const result = await menuCollection.insertOne(menu);
        res.send(result);
    });

    //--------Menu-------Item------Update--------
    app.put("/menu/:id", async(req, res) => {
      const id = req.params.id;
      const data = req.body;
      const filter = {_id: new ObjectId(id)};
      const options = {upsert: true};
      const UpdateDoc = {
        $set: {
          name: data.name,
          price: parseFloat(data.price),
          category: data.category,
          recipe: data.recipe,
          image: data.image,
        },
      };
      const result = await menuCollection.updateOne(filter, UpdateDoc, options)
      res.send(result)
    })


    //--------Menu-------Item------Delete--------
    app.delete('/menu/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await menuCollection.deleteOne(query)
      res.send(result)
    })



    //============Carts==========Related==========Api===========
    // -----Gating-----Carts---in---Chaking---Using-----Email----db-----
    app.get('/carts', async(req, res) => {
      const email = req.query.email;
      const filter = {email: email};
      const result = await cartCollection.find(filter).toArray();
      res.send(result)
    })


    //-----Gating-----All-------Cart------by------db-----
    app.get('/carts', async(req, res) => {
      const cursor = cartCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    });

    //-----Gating-----Single-------Cart------by------db-----
    app.get('/carts/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await cartCollection.findOne(query);
      res.send(result);
    })


    //-----Posting-----Cart-----to------db-----
    app.post('/carts', async(req, res) => {
      const cartItem = req.body;
      const result = await cartCollection.insertOne(cartItem);
      res.send(result);
    })


    //-------Update---Cart---Quantity-----Item-----
    app.put('/carts/:id', async(req, res) => {
      const id = req.params.id;
      const {quantity} = req.body;
      const filter = {_id: new ObjectId(id)};
      const options = {upsert: true};
      const UpdateDoc = {
        $set: {
          quantity: parseInt(quantity, 10)
        },
      };
      const result = await cartCollection.updateOne(filter , UpdateDoc, options);
      res.send(result);
    });

    //-----Delided-----Cart-----to------db-----
    app.delete('/carts/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await cartCollection.deleteOne(query);
      res.send(result)
    });


  //============User==========Related==========Api===========
  //-------New-----All----User-----See------GET--------
  app.get('/users', async(req, res) => {
    const cursor = userCullection.find()
    const result = await cursor.toArray();
    res.send(result)
  })

  //-------New-----User-----Created------POST-------- 
   app.post('/users', async(req, res) =>{
    const user = req.body;
    console.log("Create a new user..?", user)
    const result = await userCullection.insertOne(user)
    res.send(result)
   })




  //--------Stripe------Post-------Payment-----Methoddd-------
  app.post("/create-payment-intent", async (req, res) => {
    const { price } = req.body;
    const amount = price*100;
  
    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "usd",
      payment_method_types: ["card"],
    });
  
    res.send({
      clientSecret: paymentIntent.client_secret,  
    });
  });


  //============Payment==========Related==========Api===========
  //--------Single------Payment-----Sytem-----Email-----Get----------
  app.get('/payments', async(req, res) => {
    const email = req.query.email;
    const query = {email: email};
    const result = await paymentCullection.find(query).toArray();
    res.send(result)
  })


  //----------All-------Payment------Sytem------Get----------
  app.get('/payments', async(req, res) => {
    const cursor = paymentCullection.find();
    const result = await cursor.toArray();
    res.send(result)
  })

  //----------Single-------Payment------Sytem------Get----------
  app.get('/payments/:id', async(req, res) => {
    const id = req.params.id;
    const filter = {_id: new ObjectId(id)};
    const result = await paymentCullection.findOne(filter);
    res.send(result);
  })

  
  //-------Single------Payment-------Sytem------Post----------
  app.post('/payments', async(req, res) => {
    const paymentInfo = req.body;
    const result = await paymentCullection.insertOne(paymentInfo);
    res.send(result)
  }) 


 //-------Single------Payment-------Sytem------Delete----------
 app.delete('/payments/:id', async(req, res) => {
  const id = req.params.id;
  const query = {_id: new ObjectId(id)};
  const result = await paymentCullection.deleteOne(query)
  res.send(result)
})


  


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send("Food Delevery Server Is Running.....?")
})

app.listen(port, (req, res) => {
    console.log(`Server Is Running PORT : ${port}`)
})
