du: 
	@echo "Running docker-compose up..."
	@docker-compose up -d --remove-orphans

dd:
	@echo "Running docker-compose down..."
	@docker-compose down --remove-orphans


mig-gen:
	@read -p "Enter migration name: " name; \
	echo "Creating migration $$name..."; \
	npm run mig:generate --name=$$name

mig-run:
	@echo "Running migrations..."
	npm run mig:run

mig-revert:
	@echo "Reverting migrations..."
	npm run mig:revert

create-entity:
	@read -p "Enter entity name: " name; \
	echo "Creating entity $$name..."; \
	npm run entity:create --name=$$name

create-migration:
	@read -p "Enter migration name: " name; \
	echo "Creating migration $$name..."; \
	npm run mig:create --name=$$name

schema-log:
	@echo "Running schema:log..."
	npm run schema:log