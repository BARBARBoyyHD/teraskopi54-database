const express = require("express");
const app = express();
const pool = require("./db");
const cors = require("cors");
const bcrypt = require("bcrypt");

const port = 5000;
// middleware
app.use(cors());
app.use(express.json());

// login cashier section
// User registration endpoint cashier
app.post("/api/register-cashier", async (req, res) => {
  try {
    const { username, password, contact } = req.body;

    // Hash the password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insert the new user into the database
    const newUser = await pool.query(
      "INSERT INTO user_cashier (username, password_hash, contact) VALUES ($1, $2, $3) RETURNING *",
      [username, password_hash, contact]
    );

    res.status(201).json(newUser.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});
// get all user cashier
app.get("/api/user-cashier", async (req, res) => {
  try {
    const getUserCashier = await pool.query("SELECT * FROM user_cashier");
    res.json(getUserCashier.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

// User login endpoint
app.post("/api/login-cashier", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find the user by username
    const user = await pool.query(
      "SELECT * FROM user_cashier WHERE username = $1",
      [username]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const userData = user.rows[0];
    const validPassword = await bcrypt.compare(
      password,
      userData.password_hash
    );

    if (!validPassword) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    // If the password is valid, send a success response
    return res.status(200).json({ message: "Login successful" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
});

// inventory section
// get single inventory item
app.get("/api/inventory/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const getSingleItem = await pool.query(
      "SELECT * FROM inventory WHERE item_id = $1",
      [id]
    );
  } catch (error) {
    console.log(error);
    res.json({ message: error });
  }
});
// get all inventory items
app.get("/api/inventory", async (req, res) => {
  try {
    const getAllitems = await pool.query("SELECT * FROM inventory");
    res.json(getAllitems.rows);
  } catch (error) {
    console.log(error);
    res.json({ message: error });
  }
});
// add item inventory
app.post("/api/add-item", async (req, res) => {
  try {
    const { item_name, quantity, price_per_pcs } = req.body;
    const new_item = await pool.query(
      "INSERT INTO inventory(item_name,quantity,price_per_pcs) VALUES($1,$2,$3) RETURNING *",
      [item_name, quantity, price_per_pcs]
    );
    res.json(new_item.rows[0]);
    res.status(200);
  } catch (error) {
    console.log(error);
    res.json({ message: error });
  }
});
// prodcut section

// get single product
app.get("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const getSingleProduct = await pool.query(
      "SELECT * FROM product WHERE product_id = $1",
      [id]
    );
    res.json(getSingleProduct.rows[0]);
    res.status(200);
  } catch (error) {
    console.log(error);
    res.json({ message: error });
  }
});

// get all products
app.get("/api/products", async (req, res) => {
  try {
    const getAllproducts = await pool.query("SELECT * FROM product");
    res.json(getAllproducts.rows);
    res.status(200);
  } catch (error) {
    console.log(error);
    res.json({ message: error });
  }
});
// add product
app.post("/api/add-product", async (req, res) => {
  try {
    const { product_name, product_category, quantity, product_price } =
      req.body;
    const new_product = await pool.query(
      "INSERT INTO product(product_name,product_category,quantity,product_price) VALUES($1,$2,$3,$4) RETURNING *",
      [product_name, product_category, quantity, product_price]
    );
    res.json(new_product.rows[0]);

    res.status(200);
  } catch (error) {
    console.log(error);
    res.json({ message: error });
  }
});
// cafe branch section

// get all cafe branch
app.get("/api/cafe-branch", async (req, res) => {
  try {
    const getAllbranches = await pool.query("SELECT * FROM cafe_branch");
    res.json(getAllbranches.rows);
  } catch (error) {
    console.log(error);
    res.json({ message: error });
  }
});

// add cafe branch
app.post("/api/add-cafe-branch", async (req, res) => {
  try {
    const { branch_name, address_branch, contact } = req.body;
    const new_branch = await pool.query(
      "INSERT INTO cafe_branch(branch_name, address_branch, contact) VALUES($1, $2, $3) RETURNING *",
      [branch_name, address_branch, contact]
    );
    res.status(200).json(new_branch.rows[0]); // Set the status before sending the JSON response
    res.json("data added successfully");
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message }); // Set a 500 status code on error
  }
});
// orders section

// Get all orders with their items
app.get("/api/orders", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM orders");

    // Organize results by order
    const orders = {};
    result.rows.forEach((row) => {
      if (!orders[row.order_id]) {
        orders[row.order_id] = {
          order_id: row.order_id,
          customer_name: row.customer_name,
          order_date: row.order_date,
          payment_method: row.payment_method,
          items: [],
        };
      }
      orders[row.order_id].items.push({
        product_id: row.product_id,
        product_name: row.product_name,
        quantity_order: row.quantity_order,
        price_total: row.price_total,
      });
    });

    res.json(Object.values(orders));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

// Add a new order with multiple items
app.post("/api/add-order", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { customer_name, payment_method, items } = req.body;

    // Insert each item into the orders table
    for (const item of items) {
      const { product_id, product_name, quantity_order, price_total } = item;

      await client.query(
        "INSERT INTO orders(customer_name, order_date, payment_method, product_id, product_name, quantity_order, price_total) VALUES($1, CURRENT_TIMESTAMP, $2, $3, $4, $5, $6)",
        [
          customer_name,
          payment_method,
          product_id,
          product_name,
          quantity_order,
          price_total,
        ]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ message: "Order and items added successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.log(error);
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
});

app.listen(port, () => {
  console.log("http://localhost:" + port);
});
