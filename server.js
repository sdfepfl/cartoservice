import express from 'express';
import path from 'path';
import compression from 'compression';
import React from 'react';
import cors from 'cors';

import ReactDOMServer from 'react-dom/server';
import { match, RouterContext } from 'react-router';
import routes from './modules/routes';
import apiRoute from './api/routes';

const app = express();

app.use(compression());

app.use(cors());

// serve our static stuff like index.css
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// routes the API
app.use('/api', apiRoute);

// send all requests to index.html so browserHistory works
app.get('*', (req, res) => {
  match({ routes, location: req.url }, (err, redirect, props) => {
    // in here we can make some decisions all at once
    if (err) {
      // there was an error somewhere during route matching
      res.status(500).send(err.message);
    } else if (redirect) {
      // we haven't talked about `onEnter` hooks on routes, but before a
      // route is entered, it can redirect. Here we handle on the server.
      res.redirect(redirect.pathname + redirect.search);
    } else if (props) {
      // if we got props then we matched a route and can render
      const appHtml = ReactDOMServer.renderToString(<RouterContext {...props} />);
      res.send(renderPage(appHtml));
    } else {
      // no errors, no redirect, we just didn't match anything
      res.status(404).send('Not Found');
    }
  });
});

function renderPage(appHtml) {
  return `
    <!doctype html public="storage">
    <html>
    <meta charset=utf-8/>
    <title>CartoService</title>
    <link rel=stylesheet href="/index.css">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/latest/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/flat-ui/2.3.0/css/flat-ui.min.css">
    <div id=app>${appHtml}</div>
    <script src="/bundle.js"></script>
   `;
}

let PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Production Express server running at localhost:${  PORT}`);
});
