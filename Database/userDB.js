require('dotenv').config();
const mongoose = require('mongoose');

// Add error handling for the connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Successfully connected to MongoDB.'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  hashedPassword: {
    type: String,
    required: true
  },
  phoneNo: {
    type: String,
    required: true,
    unique: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  }
}, { timestamps: true });

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  restaurantImg: {
    type: String,
    required: true,
    trim: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    required: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  }
}, { timestamps: true });

const dishSchema = new mongoose.Schema({
  dishName: {
    type: String,
    required: true,
    trim: true
  },
  imgUrl: {
    type: String,
    required: true,
    trim: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  }
}, { timestamps: true });

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  dishId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dish',
    required: true
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['Pending', 'Preparing', 'Completed', 'Cancelled'],
    default: 'Pending'
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Restaurant = mongoose.model('Restaurant', restaurantSchema);
const Dish = mongoose.model('Dish', dishSchema);
const Order = mongoose.model('Order', orderSchema);

module.exports = {
  User,
  Restaurant,
  Dish,
  Order
};