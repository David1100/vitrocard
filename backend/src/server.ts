import { createApp } from './app';
import { env } from './config/env';
import { LoyaltyService } from './services/loyaltyService';

const app = createApp();

// Asegura un programa por defecto (12 visitas) y su recompensa asociada.
new LoyaltyService()
  .ensureDefaultProgram()
  .then(() => {
    app.listen(env.port, () => {
      console.log(`Vitro API escuchando en http://localhost:${env.port} (${env.nodeEnv})`);
    });
  })
  .catch((err) => {
    console.error('No se pudo iniciar la API:', err);
    process.exit(1);
  });
