import axios from 'axios';
import express, { Request, Response } from 'express';

import { client, addRole, removeRole } from './bot';
import { Config } from './config';

const app = express();
const config = new Config();

const axiosInstance = axios.create({ baseURL: config.apiBaseUrl });

app.get('/auth', async (req: Request, res: Response) => {
  const code = req.query?.code as string;
  if (code) {
    try {
      const formData = new FormData();
      formData.append('client_id', config.clientId);
      formData.append('client_secret', config.clientSecret);
      formData.append('grant_type', 'authorization_code');
      formData.append('redirect_uri', config.redirectUri);
      formData.append('code', code);

      const tokenResponseData = await axiosInstance.post('/oauth2/token', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      const userResponse = await axiosInstance.get('/users/@me', {
        headers: {
          Authorization: `Bearer ${tokenResponseData.data.access_token}`,
        },
      });
      const userData = await userResponse.data;
      console.log('userData', userData);
      const domain = userData.email.split('@')[1];

      if (!userData.verified) {
        res.send("Seu email não foi verificado. Verifique seu email e tente novamente.");
        return
      }
      if (!config.emailDomainsAllowed.includes(domain)) {
        res.send("O email cadastrado não é permitido.");
        return
      }
      await addRole('verified', userData.id);
      await removeRole('guest', userData.id);

      res.send("Seu email está de acordo com as políticas da empresa");
      return
    } catch (e) {
      console.error('Erro:', e?.response);
    }
    res.status(200);
    return
  }
  res.status(400);
});

app.listen(config.port, async () => {
  console.log('Server is running on port', config.port);
  client.login(config.discordToken);
});
