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
        console.log('Email não verificado', userData.email);
        res.send("Seu email não foi verificado. Verifique seu email e tente novamente.");
        return
      }
      if (!config.emailDomainsAllowed.includes(domain)) {
        res.send("O email cadastrado não é permitido.");
        await removeRole('guest', userData.id);
        return
      }
      await addRole('verified', userData.id);
      await removeRole('guest', userData.id);
      if (config.sendWelcomeMessage) {
        const channel = await client.channels.fetch(config.welcomeMessageChannelId)
        if (channel?.isSendable()) {
          console.log('send welcome message to %s in channel %s', userData.global_name, channel.id);
          channel.send(`#vem-vindo @${userData.global_name}`);
        }
      }

      res.send(`
        <html>
          <body>
            <p>Seu email está de acordo com as políticas da empresa</p>
            <script>
              window.close();
            </script>
          </body>
        </html>
      `);
      return
    } catch (e: any) {
      console.error('Erro:', e?.response);
    }
    res.status(200).send();
    return
  }
  res.status(400).send();
});

app.listen(config.port, async () => {
  console.log('Server is running on port', config.port);
  client.login(config.discordToken);
});
