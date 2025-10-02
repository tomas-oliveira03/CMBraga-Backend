# Project Setup Instructions

## Docker Setup

### Build Docker
`make du` 

### Destroy Docker
`make dd`

## Server Setup

### Run Server 
`npm run dev:server`

## Database Setup

### Add Table
`make create-entity`

### Add Migration
`make mig-gen`

### Commit changes
`make mig-run`

### Revert commited changes
`make mig-revert`

### Check if there are any changes left to commit
`make schema-log`

