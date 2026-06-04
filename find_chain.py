import sys
import importlib
import pkgutil

def find_func(module_name, func_name):
    try:
        mod = importlib.import_module(module_name)
        if hasattr(mod, func_name):
            print(f"Found in {module_name}")
    except Exception:
        pass

for mod in ['langchain', 'langchain_community', 'langchain_core', 'langchain_experimental']:
    try:
        m = importlib.import_module(mod)
        for _, name, _ in pkgutil.walk_packages(m.__path__, m.__name__ + "."):
            find_func(name, "create_sql_query_chain")
    except Exception as e:
        pass
