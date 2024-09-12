const express = require('express');
const stripe = require('stripe')('sk_test_51OexNZKqnFl9CSHJPDuPtianNXkdUT437GLzUSxbaar29WHs0D71EGOy4zTkUc6b279qQtjxtZ4whV5hAlYHvIjy001TGLtULG');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3010;

app.use(cors()); // Autorisez toutes les requêtes CORS
app.use(bodyParser.json());

// Point de terminaison pour créer une session de paiement
app.post('/create-checkout-session', async (req, res) => {
  const { items, success_url, cancel_url } = req.body;

  // Affiche les éléments reçus
  console.log('Items reçus pour Stripe:', items);

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map(item => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.name,
            description: item.description
          },
          unit_amount: item.amount,
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url,
      cancel_url,
    });

    res.json({ sessionId: session.url });
  } catch (error) {
    console.error('Erreur lors de la création de la session de paiement :', error);
    res.status(500).json({ error: 'Erreur lors de la création de la session de paiement' });
  }
});


app.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
});
