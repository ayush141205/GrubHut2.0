const { Router } = require('express');
const { User, Restaurant, Dish, Order } = require('../Database/userDB');
const { userSignupSchema, userSigninSchema, orderSchema } = require('../validators/schemas');
const { userAuth } = require('../middlewares/auth');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const userRouter = Router();

userRouter.post('/restaurant',async (req, res) => {
    try {
      // Validate the incoming data (you can use your validation schema here if needed)
      const { name, restaurantImg, rating, address } = req.body;
  
      if (!name || !restaurantImg || !rating || !address) {
        return res.status(400).json({ message: 'All fields are required' });
      }
  
      // Create a new restaurant document using the .create method
      const newRestaurant = await Restaurant.create({
        name,
        restaurantImg,
        rating,
        address
      });
  
      // Respond with a success message and the created restaurant data
      res.status(201).json({
        message: 'Restaurant created successfully',
        restaurant: newRestaurant
      });
    } catch (error) {
      console.error('Error creating restaurant:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
// userRouter.post('/dish', async (req, res) => {
//     try {
//       const { dishName, imgUrl, rating, description, price, restaurantId } = req.body;
  
//       // Check if restaurantId exists (validation)
//       if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
//         return res.status(400).json({ error: 'Invalid restaurant ID' });
//       }
  
//       // Create the new dish
//       const newDish = new Dish({
//         dishName,
//         imgUrl,
//         rating,
//         description,
//         price,
//         restaurantId
//       });
  
//       // Save the dish to the database
//       await newDish.save();
  
//       // Return the created dish
//       res.status(201).json(newDish);
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ error: 'Internal server error' });
//     }
//   });

userRouter.post('/signup', async (req, res) => {
  try {
    const validatedData = userSignupSchema.parse(req.body);
    
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    
    await User.create({
      ...validatedData,
      hashedPassword
    });

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

userRouter.post('/signin', async (req, res) => {
  try {
    const validatedData = userSigninSchema.parse(req.body);
    
    const user = await User.findOne({ email: validatedData.email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(validatedData.password, user.hashedPassword);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id.toString() },
      process.env.JWT_USER_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      token,
      message: 'Signed in successfully'
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Sign-in error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

userRouter.get('/restaurants', userAuth, async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    
    if (restaurants.length === 0) {
      return res.status(404).json({ message: 'No restaurants found' });
    }
    
    res.status(200).json(restaurants);
  } catch (error) {
    console.error('Error retrieving restaurants:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

userRouter.get('/restaurant/:restaurantId/dishes', userAuth, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    const dishes = await Dish.find({ restaurantId });
    if (dishes.length === 0) {
      return res.status(404).json({ message: 'No dishes found for this restaurant' });
    }
    
    res.status(200).json(dishes);
  } catch (error) {
    console.error('Error retrieving dishes:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

userRouter.post('/new/order', userAuth, async (req, res) => {
  try {
    const validatedData = orderSchema.parse({
      ...req.body,
      userId: req.userId
    });
    
    const [user, restaurant, dish] = await Promise.all([
      User.findById(validatedData.userId),
      Restaurant.findById(validatedData.restaurantId),
      Dish.findById(validatedData.dishId)
    ]);

    if (!user || !restaurant || !dish) {
      return res.status(404).json({ 
        message: 'Invalid order details. Please check user, restaurant and dish.' 
      });
    }

    const newOrder = await Order.create(validatedData);
    
    res.status(201).json({
      message: 'Order placed successfully',
      order: newOrder
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error placing order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

userRouter.get('/orders', userAuth, async (req, res) => {
    try {
      const orders = await Order.find({ userId: req.userId })
        .populate('restaurantId', 'name address') // Get restaurant details
        .populate('dishId', 'dishName price imgUrl') // Get dish details
        .sort({ orderDate: -1 }); // Sort by newest first
  
      if (orders.length === 0) {
        return res.status(404).json({ 
          message: 'No orders found' 
        });
      }
  
      // Format the response data
      const formattedOrders = orders.map(order => ({
        orderId: order._id,
        orderDate: order.orderDate,
        status: order.status,
        quantity: order.quantity,
        restaurant: {
          name: order.restaurantId.name,
          address: order.restaurantId.address
        },
        dish: {
          name: order.dishId.dishName,
          price: order.dishId.price,
          image: order.dishId.imgUrl
        },
        totalAmount: order.quantity * order.dishId.price
      }));
  
      res.status(200).json({
        message: 'Orders retrieved successfully',
        orders: formattedOrders
      });
    } catch (error) {
      console.error('Error retrieving orders:', error);
      res.status(500).json({ message: 'Error retrieving orders' });
    }
  });
  
  // Get specific order details
  userRouter.get('/orders/:orderId', userAuth, async (req, res) => {
    try {
      const { orderId } = req.params;
  
      const order = await Order.findOne({ 
        _id: orderId,
        userId: req.userId // Ensure user can only access their own orders
      })
        .populate('restaurantId', 'name address rating restaurantImg')
        .populate('dishId', 'dishName price imgUrl description rating')
        .populate('userId', 'name address phoneNo');
  
      if (!order) {
        return res.status(404).json({ 
          message: 'Order not found or unauthorized access' 
        });
      }
  
      // Format the response with detailed information
      const orderDetails = {
        orderId: order._id,
        orderDate: order.orderDate,
        status: order.status,
        quantity: order.quantity,
        customer: {
          name: order.userId.name,
          address: order.userId.address,
          phoneNo: order.userId.phoneNo
        },
        restaurant: {
          name: order.restaurantId.name,
          address: order.restaurantId.address,
          rating: order.restaurantId.rating,
          image: order.restaurantId.restaurantImg
        },
        dish: {
          name: order.dishId.dishName,
          description: order.dishId.description,
          price: order.dishId.price,
          image: order.dishId.imgUrl,
          rating: order.dishId.rating
        },
        totalAmount: order.quantity * order.dishId.price,
        deliveryAddress: order.userId.address
      };
  
      res.status(200).json({
        message: 'Order details retrieved successfully',
        order: orderDetails
      });
    } catch (error) {
      console.error('Error retrieving order details:', error);
      if (error.name === 'CastError') {
        return res.status(400).json({ message: 'Invalid order ID format' });
      }
      res.status(500).json({ message: 'Error retrieving order details' });
    }
  });
  
  // Get order statistics for the user
  userRouter.get('/orders/stats', userAuth, async (req, res) => {
    try {
      const orders = await Order.find({ userId: req.userId });
      
      // Calculate various statistics
      const stats = {
        totalOrders: orders.length,
        ordersByStatus: {
          Pending: orders.filter(order => order.status === 'Pending').length,
          Preparing: orders.filter(order => order.status === 'Preparing').length,
          Completed: orders.filter(order => order.status === 'Completed').length,
          Cancelled: orders.filter(order => order.status === 'Cancelled').length
        },
        // Get orders for last 7 days
        recentOrders: await Order.find({
          userId: req.userId,
          orderDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        })
          .populate('dishId', 'dishName price')
          .populate('restaurantId', 'name')
          .sort({ orderDate: -1 })
          .limit(5)
      };
  
      // Calculate total spending
      const totalSpending = await Order.aggregate([
        { 
          $match: { 
            userId: mongoose.Types.ObjectId(req.userId),
            status: 'Completed'
          }
        },
        {
          $lookup: {
            from: 'dishes',
            localField: 'dishId',
            foreignField: '_id',
            as: 'dish'
          }
        },
        {
          $unwind: '$dish'
        },
        {
          $group: {
            _id: null,
            total: { 
              $sum: { $multiply: ['$quantity', '$dish.price'] }
            }
          }
        }
      ]);
  
      stats.totalSpending = totalSpending.length > 0 ? totalSpending[0].total : 0;
  
      res.status(200).json({
        message: 'Order statistics retrieved successfully',
        statistics: stats
      });
    } catch (error) {
      console.error('Error retrieving order statistics:', error);
      res.status(500).json({ message: 'Error retrieving order statistics' });
    }
  });
  

module.exports = { userRouter };