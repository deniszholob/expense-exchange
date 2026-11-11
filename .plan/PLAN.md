# Expense Exchange Finance app

A versatile hosting tool to help with managing budgets and expenses bor single or multiple people.

# Features

## Solve these problems

- managing expenses in a household/between people

## User Stories

### User login

- Simple/low friction login and registration
- Secure

### User dashboards/summaries/history

Some things to show including but not limited to

- Summary of who owes who
- hom much who paid for who (user1 paid for user 2 per month)
- total income
- total expenses
- % breakdown on categories
- projections on income expenses, investments (401k, roth, savings), etc... based on history
- graph of time vs $$$
- shows reoccuring costs (marked clearly and shown daily,weekly, biweekly,monthly, annyual, biannual, etc...)
- clearly labled reoccuring costs
- monthly,biweekly,weekly,daily,yearly, by-yearly costs
- history of all transactions ordered by date, grouped by month/user/amount, etc..
- projections/expected investment growth based on history
  - input/(fetch for fidelity etc..) monthly net worth to then caclulate projections?
- User privacy: user1 cant see user2 finances only their own (except what was shared)

### Adding Expenses

- Add singe cost
- Add reoccuring costs (bills, subscriptions, investments etc..)
- Costs must have basic dat like: amount, date, description
- Cost must have some extra data like (not limited to)
  - purchase category (income, investments, transportation, food, entertainment etc..)
- Cost must have and who is included in the costs (at least 1, more if the cost is shared b/w multiple people)
- Cost will be paid BY a person (defaults to logged in user)
- cost can be paid FOR a person (defaults to logged in user)
- easy way to add returns and refunds
- paying from joint accounts

examples of some combinations possible (not all):

- user1 pays $10 for meal for user1
- user1 pays $10 for x for user 2
- user 2 and user 1 pays for user2, user3
- user1 retuned items (some for user1 asome for both etc...) and got refund sent to their acc
- user1 got a giftcard from user2 and used it to buy things for both users etc..

Bonus:

- Able to scan a recipet from something like wallmart and be able to import expenses more easily
- connect (free) to amazon, fidelity, bank, etc.. to pull info

## Inspiration

- Splitwize
- Fidelity

# Theming

- Dark theme
- Finance theme (greens)

# Architecture

## I can be

- ran locally in electron
- access a local docker instance (like unraid)
- deployed docker on web server.

## Data/backend can be

- against a simple file in a shared folder (on a local share, or synced to google drive etc..)
- access a local api docker instance (like unraid) with a db like postgres
- deployed docker on web server
- in web ui localstorage for testing only

# Tech

# Dev

- nx
- https://www.npmjs.com/package/@deniszholob/storybook-auto-titles

## UI

- Angular
- Tailwind
- Material CDK
- NG-Select
- Storybook
- Ag-Grid

## Backend/DB

- CSV/JSON <= use db.json esp for initial dev
- Postgre SQL
- NestJs
- Swagger (OpenAPI)
- TypeORM

## Distribution

- ElectronJs
- Docker
