---
description: Use quando precisar consultar informações sobre os agentes e verificação das conexões com a integração das instancias da evolution api
alwaysApply: false
---
Vamos lá... Como funciona o evolutionBot:


Para criar um bot (agente) usamos o endpoint:

post {{baseUrl}}/evolutionBot/create/{{instance}}
header apikey: apikey da instancia

body: 

{
  "enabled": true,
  "description": "Novo bot1",
  "apiUrl": "http://api.site.com/v1",
  "apiKey": "app-123456",
  "triggerType": "keyword", /* all or keyword */
  "triggerOperator": "equals", /* contains, equals, startsWith, endsWith, regex, none */
  "triggerValue": "teste",
  "expire": 0,
  "keywordFinish": "#SAIR",
  "delayMessage": 1000,
  "unknownMessage": "Mensagem não reconhecida",
  "listeningFromMe": true,
  "stopBotFromMe": true,
  "keepOpen": true,
  "debounceTime": 10,
  "splitMessages": true,
  "timePerChar": 50,
  "ignoreJids": ["@g.us"]
}


modelo de resposta:


{
"id": 
"cmcu53xby27yto154e5db7n5o",
"enabled": 
true,
"description": 
"Novo bot",
"apiUrl": 
"http://api.site.com/v1",
"apiKey": 
"app-123456",
"expire": 
0,
"keywordFinish": 
"#SAIR",
"delayMessage": 
1000,
"unknownMessage": 
"Mensagem não reconhecida",
"listeningFromMe": 
true,
"stopBotFromMe": 
true,
"keepOpen": 
true,
"debounceTime": 
10,
"ignoreJids": 
[
"@g.us"
],
"splitMessages": 
true,
"timePerChar": 
50,
"triggerType": 
"keyword",
"triggerOperator": 
"equals",
"triggerValue": 
"teste",
"createdAt": 
"2025-07-08T06:19:24.670Z",
"updatedAt": 
"2025-07-08T06:19:24.670Z",
"instanceId": 
"f8055204-2a0a-4dcb-8b39-f9ef350d4ed0"
}

para atualizar um bot (agente) usamos o endpoint:

put {{baseUrl}}/evolutionBot/update/:evolutionBotId/{{instance}}
header apikey: apikey da instancia

body:

{
  "enabled": true,
  "description": "Novo bot1",
  "apiUrl": "http://api.site.com/v1",
  "apiKey": "app-123456",
  "triggerType": "keyword", /* all or keyword */
  "triggerOperator": "equals", /* contains, equals, startsWith, endsWith, regex, none */
  "triggerValue": "teste",
  "expire": 0,
  "keywordFinish": "#SAIR",
  "delayMessage": 1000,
  "unknownMessage": "Mensagem não reconhecida",
  "listeningFromMe": true,
  "stopBotFromMe": true,
  "keepOpen": true,
  "debounceTime": 10,
  "splitMessages": true,
  "timePerChar": 50,
  "ignoreJids": ["@g.us"]
}

modelo de resposta:


{
"id": 
"cmcu4uarm27yro154ac65g5yl",
"enabled": 
true,
"description": 
"Novo bot1",
"apiUrl": 
"http://api.site.com/v1",
"apiKey": 
"app-123456",
"expire": 
0,
"keywordFinish": 
"#SAIR",
"delayMessage": 
1000,
"unknownMessage": 
"Mensagem não reconhecida",
"listeningFromMe": 
true,
"stopBotFromMe": 
true,
"keepOpen": 
true,
"debounceTime": 
10,
"ignoreJids": 
[
"@g.us"
],
"splitMessages": 
true,
"timePerChar": 
50,
"triggerType": 
"keyword",
"triggerOperator": 
"equals",
"triggerValue": 
"teste",
"createdAt": 
"2025-07-08T06:11:55.522Z",
"updatedAt": 
"2025-07-08T06:17:14.090Z",
"instanceId": 
"f8055204-2a0a-4dcb-8b39-f9ef350d4ed0"
}

para deletarmos um bot (agente) endpoint o é o:

delete {{baseUrl}}/evolutionBot/delete/:evolutionBotId/{{instance}}
header apikey: apikey da instancia

modelo de respota:


{
"bot": 
{
"id": 
"cmcu4uarm27yro154ac65g5yl"
}
}



Para salvar um bot como padrão usamos o endpoint:

post: {{baseUrl}}/evolutionBot/settings/{{instance}}
header apikey: apikey da instancia

body: 

{
  "fallbackId": "id do bot que será padrão",
  "expire": 0,
  "keywordFinish": "#SAIR",
  "delayMessage": 1000,
  "unknownMessage": "Mensagem não reconhecida",
  "listeningFromMe": true,
  "stopBotFromMe": true,
  "keepOpen": true,
  "debounceTime": 10,
  "splitMessages": true,
  "timePerChar": 50,
  "ignoreJids": ["@g.us"]
}

modelo de resposta:


{
"id": 
"cmcu4codw27yjo1540hirt7q3",
"expire": 
0,
"keywordFinish": 
"#SAIR",
"delayMessage": 
1000,
"unknownMessage": 
"Mensagem não reconhecida",
"listeningFromMe": 
true,
"stopBotFromMe": 
true,
"keepOpen": 
true,
"debounceTime": 
10,
"ignoreJids": 
[
"@g.us"
],
"splitMessages": 
true,
"timePerChar": 
50,
"createdAt": 
"2025-07-08T05:58:13.363Z",
"updatedAt": 
"2025-07-08T06:36:12.279Z",
"botIdFallback": 
"cmcu53xby27yto154e5db7n5o",
"instanceId": 
"f8055204-2a0a-4dcb-8b39-f9ef350d4ed0",
"fallbackId": 
"cmcu53xby27yto154e5db7n5o"
}

para puxar as configurações de um bot padrão usamos o endpoint:

get {{baseUrl}}/evolutionBot/fetchSettings/{{instance}}
header apikeu: apikey da instancia

modelo de resposta:


"triggerValue": 
"teste",
"createdAt": 
"2025-07-08T06:19:24.670Z",
"updatedAt": 
"2025-07-08T06:19:24.670Z",
"instanceId": 
"f8055204-2a0a-4dcb-8b39-f9ef350d4ed0"
},
"fallbackId": 
"cmcu53xby27yto154e5db7n5o",
"fallback": 
{
"id": 
"cmcu53xby27yto154e5db7n5o",
"enabled": 
true,
"description": 
"Novo bot",
"apiUrl": 
"http://api.site.com/v1",
"apiKey": 
"app-123456",
"expire": 
0,
"keywordFinish": 
"#SAIR",
"delayMessage": 
1000,
"unknownMessage": 
"Mensagem não reconhecida",
"listeningFromMe": 
true,
"stopBotFromMe": 
true,
"keepOpen": 
true,
"debounceTime": 
10,
"ignoreJids": 
[
"@g.us"
],
"splitMessages": 
true,
"timePerChar": 
50,
"triggerType": 
"keyword",
"triggerOperator": 
"equals",
"triggerValue": 
"teste",
"createdAt": 
"2025-07-08T06:19:24.670Z",
"updatedAt": 
"2025-07-08T06:19:24.670Z",
"instanceId": 
"f8055204-2a0a-4dcb-8b39-f9ef350d4ed0"
}
}Vamos lá... Como funciona o evolutionBot:


Para criar um bot (agente) usamos o endpoint:

post {{baseUrl}}/evolutionBot/create/{{instance}}
header apikey: apikey da instancia

body: 

{
  "enabled": true,
  "description": "Novo bot1",
  "apiUrl": "http://api.site.com/v1",
  "apiKey": "app-123456",
  "triggerType": "keyword", /* all or keyword */
  "triggerOperator": "equals", /* contains, equals, startsWith, endsWith, regex, none */
  "triggerValue": "teste",
  "expire": 0,
  "keywordFinish": "#SAIR",
  "delayMessage": 1000,
  "unknownMessage": "Mensagem não reconhecida",
  "listeningFromMe": true,
  "stopBotFromMe": true,
  "keepOpen": true,
  "debounceTime": 10,
  "splitMessages": true,
  "timePerChar": 50,
  "ignoreJids": ["@g.us"]
}


modelo de resposta:


{
"id": 
"cmcu53xby27yto154e5db7n5o",
"enabled": 
true,
"description": 
"Novo bot",
"apiUrl": 
"http://api.site.com/v1",
"apiKey": 
"app-123456",
"expire": 
0,
"keywordFinish": 
"#SAIR",
"delayMessage": 
1000,
"unknownMessage": 
"Mensagem não reconhecida",
"listeningFromMe": 
true,
"stopBotFromMe": 
true,
"keepOpen": 
true,
"debounceTime": 
10,
"ignoreJids": 
[
"@g.us"
],
"splitMessages": 
true,
"timePerChar": 
50,
"triggerType": 
"keyword",
"triggerOperator": 
"equals",
"triggerValue": 
"teste",
"createdAt": 
"2025-07-08T06:19:24.670Z",
"updatedAt": 
"2025-07-08T06:19:24.670Z",
"instanceId": 
"f8055204-2a0a-4dcb-8b39-f9ef350d4ed0"
}

para atualizar um bot (agente) usamos o endpoint:

put {{baseUrl}}/evolutionBot/update/:evolutionBotId/{{instance}}
header apikey: apikey da instancia

body:

{
  "enabled": true,
  "description": "Novo bot1",
  "apiUrl": "http://api.site.com/v1",
  "apiKey": "app-123456",
  "triggerType": "keyword", /* all or keyword */
  "triggerOperator": "equals", /* contains, equals, startsWith, endsWith, regex, none */
  "triggerValue": "teste",
  "expire": 0,
  "keywordFinish": "#SAIR",
  "delayMessage": 1000,
  "unknownMessage": "Mensagem não reconhecida",
  "listeningFromMe": true,
  "stopBotFromMe": true,
  "keepOpen": true,
  "debounceTime": 10,
  "splitMessages": true,
  "timePerChar": 50,
  "ignoreJids": ["@g.us"]
}

modelo de resposta:


{
"id": 
"cmcu4uarm27yro154ac65g5yl",
"enabled": 
true,
"description": 
"Novo bot1",
"apiUrl": 
"http://api.site.com/v1",
"apiKey": 
"app-123456",
"expire": 
0,
"keywordFinish": 
"#SAIR",
"delayMessage": 
1000,
"unknownMessage": 
"Mensagem não reconhecida",
"listeningFromMe": 
true,
"stopBotFromMe": 
true,
"keepOpen": 
true,
"debounceTime": 
10,
"ignoreJids": 
[
"@g.us"
],
"splitMessages": 
true,
"timePerChar": 
50,
"triggerType": 
"keyword",
"triggerOperator": 
"equals",
"triggerValue": 
"teste",
"createdAt": 
"2025-07-08T06:11:55.522Z",
"updatedAt": 
"2025-07-08T06:17:14.090Z",
"instanceId": 
"f8055204-2a0a-4dcb-8b39-f9ef350d4ed0"
}

para deletarmos um bot (agente) endpoint o é o:

delete {{baseUrl}}/evolutionBot/delete/:evolutionBotId/{{instance}}
header apikey: apikey da instancia

modelo de respota:


{
"bot": 
{
"id": 
"cmcu4uarm27yro154ac65g5yl"
}
}



Para salvar um bot como padrão usamos o endpoint:

post: {{baseUrl}}/evolutionBot/settings/{{instance}}
header apikey: apikey da instancia

body: 

{
  "fallbackId": "id do bot que será padrão",
  "expire": 0,
  "keywordFinish": "#SAIR",
  "delayMessage": 1000,
  "unknownMessage": "Mensagem não reconhecida",
  "listeningFromMe": true,
  "stopBotFromMe": true,
  "keepOpen": true,
  "debounceTime": 10,
  "splitMessages": true,
  "timePerChar": 50,
  "ignoreJids": ["@g.us"]
}

modelo de resposta:


{
"id": 
"cmcu4codw27yjo1540hirt7q3",
"expire": 
0,
"keywordFinish": 
"#SAIR",
"delayMessage": 
1000,
"unknownMessage": 
"Mensagem não reconhecida",
"listeningFromMe": 
true,
"stopBotFromMe": 
true,
"keepOpen": 
true,
"debounceTime": 
10,
"ignoreJids": 
[
"@g.us"
],
"splitMessages": 
true,
"timePerChar": 
50,
"createdAt": 
"2025-07-08T05:58:13.363Z",
"updatedAt": 
"2025-07-08T06:36:12.279Z",
"botIdFallback": 
"cmcu53xby27yto154e5db7n5o",
"instanceId": 
"f8055204-2a0a-4dcb-8b39-f9ef350d4ed0",
"fallbackId": 
"cmcu53xby27yto154e5db7n5o"
}

para puxar as configurações de um bot padrão usamos o endpoint:

get {{baseUrl}}/evolutionBot/fetchSettings/{{instance}}
header apikeu: apikey da instancia

modelo de resposta:


"triggerValue": 
"teste",
"createdAt": 
"2025-07-08T06:19:24.670Z",
"updatedAt": 
"2025-07-08T06:19:24.670Z",
"instanceId": 
"f8055204-2a0a-4dcb-8b39-f9ef350d4ed0"
},
"fallbackId": 
"cmcu53xby27yto154e5db7n5o",
"fallback": 
{
"id": 
"cmcu53xby27yto154e5db7n5o",
"enabled": 
true,
"description": 
"Novo bot",
"apiUrl": 
"http://api.site.com/v1",
"apiKey": 
"app-123456",
"expire": 
0,
"keywordFinish": 
"#SAIR",
"delayMessage": 
1000,
"unknownMessage": 
"Mensagem não reconhecida",
"listeningFromMe": 
true,
"stopBotFromMe": 
true,
"keepOpen": 
true,
"debounceTime": 
10,
"ignoreJids": 
[
"@g.us"
],
"splitMessages": 
true,
"timePerChar": 
50,
"triggerType": 
"keyword",
"triggerOperator": 
"equals",
"triggerValue": 
"teste",
"createdAt": 
"2025-07-08T06:19:24.670Z",
"updatedAt": 
"2025-07-08T06:19:24.670Z",
"instanceId": 
"f8055204-2a0a-4dcb-8b39-f9ef350d4ed0"
}
}

Já para puxar as informações de evolution bot padrão usamos o endpoint:

get: {{baseUrl}}/evolutionBot/fetchSettings/{{instance}}
header apikey: apikey da instancia

modelo de resposta:

  {
    "id": "cmcu4codw27yjo1540hirt7q3",
    "expire": 0,
    "keywordFinish": "#SAIR",
    "delayMessage": 1000,
    "unknownMessage": "Mensagem não reconhecida",
    "listeningFromMe": true,
    "stopBotFromMe": true,
    "keepOpen": true,
    "debounceTime": 10,
    "ignoreJids": [
      "@g.us"
    ],
    "splitMessages": true,
    "timePerChar": 50,
    "createdAt": "2025-07-08T05:58:13.363Z",
    "updatedAt": "2025-07-08T06:36:12.279Z",
    "botIdFallback": "cmcu53xby27yto154e5db7n5o",
    "instanceId": "f8055204-2a0a-4dcb-8b39-f9ef350d4ed0",
    "Fallback": {
      "id": "cmcu53xby27yto154e5db7n5o",
      "enabled": true,
      "description": "Novo bot",
      "apiUrl": "http://api.site.com/v1",
      "apiKey": "app-123456",
      "expire": 0,
      "keywordFinish": "#SAIR",
      "delayMessage": 1000,
      "unknownMessage": "Mensagem não reconhecida",
      "listeningFromMe": true,
      "stopBotFromMe": true,
      "keepOpen": true,
      "debounceTime": 10,
      "ignoreJids": [
        "@g.us"
      ],
      "splitMessages": true,
      "timePerChar": 50,
      "triggerType": "keyword",
      "triggerOperator": "equals",
      "triggerValue": "teste",
      "createdAt": "2025-07-08T06:19:24.670Z",
      "updatedAt": "2025-07-08T06:19:24.670Z",
      "instanceId": "f8055204-2a0a-4dcb-8b39-f9ef350d4ed0"
    },
    "fallbackId": "cmcu53xby27yto154e5db7n5o",
    "fallback": {
      "id": "cmcu53xby27yto154e5db7n5o",
      "enabled": true,
      "description": "Novo bot",
      "apiUrl": "http://api.site.com/v1",
      "apiKey": "app-123456",
      "expire": 0,
      "keywordFinish": "#SAIR",
      "delayMessage": 1000,
      "unknownMessage": "Mensagem não reconhecida",
      "listeningFromMe": true,
      "stopBotFromMe": true,
      "keepOpen": true,
      "debounceTime": 10,
      "ignoreJids": [
        "@g.us"
      ],
      "splitMessages": true,
      "timePerChar": 50,
      "triggerType": "keyword",
      "triggerOperator": "equals",
      "triggerValue": "teste",
      "createdAt": "2025-07-08T06:19:24.670Z",
      "updatedAt": "2025-07-08T06:19:24.670Z",
      "instanceId": "f8055204-2a0a-4dcb-8b39-f9ef350d4ed0"
    }
  }


  Agora um endpoint pra puxar todos os Evolution bot de uma instancia é o:

  get {{baseUrl}}/evolutionBot/find/{{instance}}
  header apikey: apikey da instancia

  modelo de resposta:

  {
    "id": "cmcu4coe527ylo154xntkargo",
    "enabled": true,
    "description": "dggdg",
    "apiUrl": "https://apizap.impa365.com",
    "apiKey": "dd5a621462bb444aa28e0f58b982a340",
    "expire": 0,
    "keywordFinish": "/sair",
    "delayMessage": 1000,
    "unknownMessage": "Desconhecida mensagem",
    "listeningFromMe": true,
    "stopBotFromMe": true,
    "keepOpen": true,
    "debounceTime": 454,
    "ignoreJids": null,
    "splitMessages": true,
    "timePerChar": 56,
    "triggerType": "keyword",
    "triggerOperator": "contains",
    "triggerValue": "dgdg",
    "createdAt": "2025-07-08T05:58:13.373Z",
    "updatedAt": "2025-07-08T06:05:11.329Z",
    "instanceId": "f8055204-2a0a-4dcb-8b39-f9ef350d4ed0"
  },
  {
    "id": "cmcu53xby27yto154e5db7n5o",
    "enabled": true,
    "description": "Novo bot",
    "apiUrl": "http://api.site.com/v1",
    "apiKey": "app-123456",
    "expire": 0,
    "keywordFinish": "#SAIR",
    "delayMessage": 1000,
    "unknownMessage": "Mensagem não reconhecida",
    "listeningFromMe": true,
    "stopBotFromMe": true,
    "keepOpen": true,
    "debounceTime": 10,
    "ignoreJids": [
      "@g.us"
    ],
    "splitMessages": true,
    "timePerChar": 50,
    "triggerType": "keyword",
    "triggerOperator": "equals",
    "triggerValue": "teste",
    "createdAt": "2025-07-08T06:19:24.670Z",
    "updatedAt": "2025-07-08T06:19:24.670Z",
    "instanceId": "f8055204-2a0a-4dcb-8b39-f9ef350d4ed0"
  }

  E essas são as requisições da evolution api, para criar/configurar o evolution bot