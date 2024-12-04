import axios from 'axios';
import ngrok from '@ngrok/ngrok';
import express, { Request, Response } from 'express';

import { Bot } from './bot';
import { Config } from './config';

const app = express();
const config = new Config();
const bot = new Bot();

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
      const domain = userData.email.split('@')[1];
      const member = await bot.getMemberInGuild(userData.id);
      if(!member) {
        console.error('Member not found');
        res.status(409).send();
        return;
      }
      if (!config.emailDomainsAllowed.includes(domain)) {
        member.kick('Email não permitido');
        res.send("O email cadastrado não é permitido.");
        return;
      }
      if (!userData.verified) {
        console.log('Email não verificado', userData.email);
        res.send("Seu email não foi verificado. Verifique seu email e tente novamente.");
        return;
      }
      await bot.addRole('verified', member);
      await bot.removeRole('guest', member);

      if (config.sendWelcomeMessage) {
        const channel = await bot.getChannelById(config.welcomeMessageChannelId)
        if (channel?.isSendable()) {
          console.log('send welcome message to %s in channel %s', userData.global_name, channel.id);
          channel.send(`${channel?.toString()} ${member?.toString()}`);
        }
      }
      res.status(200).send(`
        <html>
          <body>
            <p>Seu email está de acordo com as políticas da empresa</p>
            <script>
              window.close();
            </script>
          </body>
        </html>
      `);
      return;
    } catch (e: any) {
      console.error('Erro:', e?.response);
      res.status(500).send();
      return;
    }
  }
  res.status(400).send();
});

app.listen(config.port, async () => {
  bot.init();

  if (config.ngrok) {
    const response = await ngrok.connect({ 
      addr: config.port,
      domain: config.ngrokDomain,
      authtoken_from_env: true,
    });
    console.log('Ngrok is running', response.url());
  }
  console.log('Server is running on port', config.port);
});
