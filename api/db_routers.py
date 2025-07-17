# your_app/db_routers.py

class Munim006Router:
    """
    A router to control all database operations on models in the
    'munim006_app' application.
    """
    route_app_labels = {'your_app'} # Replace 'your_app' with your actual app name

    def db_for_read(self, model, **hints):
        """
        Attempts to read munim006 models go to munim006_db.
        """
        if model._meta.app_label in self.route_app_labels and model._meta.db_table == 'accountmaster':
            return 'munim006_db'
        return None

    def db_for_write(self, model, **hints):
        """
        Attempts to write munim006 models go to munim006_db.
        """
        if model._meta.app_label in self.route_app_labels and model._meta.db_table == 'accountmaster':
            return 'munim006_db'
        return None

    def allow_relation(self, obj1, obj2, **hints):
        """
        Allow relations if both objects are in the munim006_db.
        """
        if (obj1._meta.app_label in self.route_app_labels and obj1._meta.db_table == 'accountmaster') or \
           (obj2._meta.app_label in self.route_app_labels and obj2._meta.db_table == 'accountmaster'):
            return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """
        Make sure the munim006_app only appears in the 'munim006_db' database.
        """
        if app_label in self.route_app_labels and model_name == 'accountmaster':
            return db == 'munim006_db'
        return None