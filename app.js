const express = require('express');
const stripe = require('stripe')('sk_test_51OexNZKqnFl9CSHJPDuPtianNXkdUT437GLzUSxbaar29WHs0D71EGOy4zTkUc6b279qQtjxtZ4whV5hAlYHvIjy001TGLtULG');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = 3010;

app.use(cors());
app.use(bodyParser.json());

app.post('/create-checkout-session', async (req, res) => {
    const { items, userId, name, street, city, postalCode, success_url, cancel_url } = req.body;

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: items.map(item => {
                const unitAmount = item.discountPrice ? Math.round(item.discountPrice * 100) : item.amount;

                return {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: item.name,
                        },
                        unit_amount: unitAmount,
                    },
                    quantity: item.quantity,
                };
            }),
            mode: 'payment',
            success_url,
            cancel_url,
        });

        const tokensToAdd = items.reduce((total, item) => {
            if (item.name.toLowerCase().includes('token')) {
                const packQuantity = parseInt(item.name.match(/\d+/)); 
                return total + (packQuantity * item.quantity); 
            }
            return total;
        }, 0);

        await axios.post(`http://localhost:3005/api/users/${userId}/add-tokens`, {
            tokensToAdd
        });

        const orderData = {
            userId,
            items: items.map(item => ({
                productId: item.productId,
                name: item.name,
                quantity: item.quantity,
                price: item.amount / 100,
                color: item.color || 'Couleur non définie',
                size: item.size || 'Taille non définie',
                customizationOptions: item.customizationOptions || {},
            })),
            totalAmount: items.reduce((total, item) => total + item.amount * item.quantity, 0) / 100,
            shippingAddress: {
                name,
                street,
                city,
                postalCode,
            }
        };

        await axios.post('http://localhost:3005/api/orders', orderData);

        res.json({ sessionId: session.url });
    } catch (error) {
        console.error('Erreur lors de la création de la session de paiement :', error);
        res.status(500).json({ error: 'Erreur lors de la création de la session de paiement' });
    }
});

app.listen(port, () => {
  console.log(`Serveur Express en cours d'exécution sur le port ${port}`);
});
