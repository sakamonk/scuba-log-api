import express from 'express';
import dotenv from 'dotenv';
import { setupSwaggerDocs } from '../swagger.config';
import { connectToDatabase } from './databaseConnection';
import { roleRoute } from './routes/role.route';
import { userRoute } from './routes/user.route';
import { logbookRoute } from './routes/logbook.route';

dotenv.config();

const HOST = process.env.HOST || 'http://localhost';
const PORT = parseInt(process.env.PORT || '4500');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/api/v1', roleRoute());
app.use('/api/v1', userRoute());
app.use('/api/v1', logbookRoute());

app.get('/api/v1/status', (req, res) => {
  return res.json({ status: 'Up and running!' });
});

app.get('/', (req, res) => {
  return res.json({ message: 'Hello from Scuba dive log app!' });
});

setupSwaggerDocs(app);

// Export the app without starting the server
export default app;

// Start the server only when not in testing mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, async () => {
    await connectToDatabase();

    console.log(`Application started on URL ${HOST}:${PORT} 🎉`);
  });
}
