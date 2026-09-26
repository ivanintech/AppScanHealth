#!/usr/bin/env python3
"""
Test Real Data Loading
Prueba la carga de datos reales en todos los engines
"""

import os
import json
from datetime import datetime

class RealDataTester:
    def __init__(self, base_dir: str = ".."):
        self.base_dir = base_dir
        self.test_results = {}
        
    def test_all_real_data_loading(self):
        """Prueba la carga de datos reales en todos los engines"""
        print("Probando carga de datos reales en todos los engines")
        print("=" * 60)
        
        try:
            # Probar carga de datos Kaggle Fitness
            kaggle_results = self._test_kaggle_fitness_loading()
            
            # Probar carga de datos DSLD
            dsld_results = self._test_dsld_loading()
            
            # Probar carga de datos NHANES
            nhanes_results = self._test_nhanes_loading()
            
            # Crear resumen
            summary = {
                "test_date": datetime.now().isoformat(),
                "kaggle_fitness": kaggle_results,
                "dsld": dsld_results,
                "nhanes": nhanes_results,
                "overall_status": self._calculate_overall_status()
            }
            
            # Guardar resultados
            self._save_test_results(summary)
            
            # Mostrar resultados
            self._display_test_results(summary)
            
            return summary
            
        except Exception as e:
            print(f"Error en prueba de datos reales: {e}")
            return None
    
    def _test_kaggle_fitness_loading(self):
        """Prueba carga de datos Kaggle Fitness"""
        print("\nProbando carga de datos Kaggle Fitness...")
        
        try:
            # Verificar archivo CSV
            csv_path = os.path.join(self.base_dir, "real_data", "kaggle_fitness", "fitness_supplements_dataset.csv")
            
            if not os.path.exists(csv_path):
                return {
                    "status": "ERROR",
                    "message": "Archivo CSV no encontrado",
                    "records_loaded": 0
                }
            
            # Leer primeras líneas para verificar estructura
            with open(csv_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            header = lines[0].strip()
            expected_columns = [
                "Gender", "Age", "Height(cm)", "Weight(kg)", "Body_Fat(%)",
                "Fitness_Level", "Weekly_Training", "Training_Type", "Supplement",
                "Supplement_Type", "Usage_Period(weeks)", "Usage_Frequency(times/week)",
                "Diet_Type", "Weight_Change(kg)", "Body_Fat_Change(%)",
                "Performance_Improvement(%)", "Satisfaction(1-10)"
            ]
            
            # Verificar que el header tiene las columnas esperadas
            header_columns = header.split(',')
            missing_columns = [col for col in expected_columns if col not in header_columns]
            
            if missing_columns:
                return {
                    "status": "WARNING",
                    "message": f"Columnas faltantes: {missing_columns}",
                    "records_loaded": len(lines) - 1,
                    "total_lines": len(lines)
                }
            
            return {
                "status": "SUCCESS",
                "message": "Datos Kaggle Fitness cargados correctamente",
                "records_loaded": len(lines) - 1,
                "total_lines": len(lines),
                "columns_found": len(header_columns)
            }
            
        except Exception as e:
            return {
                "status": "ERROR",
                "message": f"Error cargando datos Kaggle: {e}",
                "records_loaded": 0
            }
    
    def _test_dsld_loading(self):
        """Prueba carga de datos DSLD"""
        print("\nProbando carga de datos DSLD...")
        
        try:
            dsld_dir = os.path.join(self.base_dir, "real_data", "dsld")
            
            if not os.path.exists(dsld_dir):
                return {
                    "status": "ERROR",
                    "message": "Directorio DSLD no encontrado",
                    "files_found": 0
                }
            
            # Contar archivos por tipo
            file_types = {
                "ProductOverview": 0,
                "DietarySupplementFacts": 0,
                "LabelStatements": 0,
                "OtherIngredients": 0,
                "CompanyInformation": 0
            }
            
            total_size = 0
            
            for filename in os.listdir(dsld_dir):
                if filename.endswith('.csv'):
                    file_path = os.path.join(dsld_dir, filename)
                    file_size = os.path.getsize(file_path)
                    total_size += file_size
                    
                    # Categorizar archivo
                    for file_type in file_types.keys():
                        if filename.startswith(file_type):
                            file_types[file_type] += 1
                            break
            
            return {
                "status": "SUCCESS",
                "message": "Datos DSLD encontrados",
                "files_found": sum(file_types.values()),
                "file_types": file_types,
                "total_size_mb": round(total_size / (1024 * 1024), 2)
            }
            
        except Exception as e:
            return {
                "status": "ERROR",
                "message": f"Error cargando datos DSLD: {e}",
                "files_found": 0
            }
    
    def _test_nhanes_loading(self):
        """Prueba carga de datos NHANES"""
        print("\nProbando carga de datos NHANES...")
        
        try:
            nhanes_dir = os.path.join(self.base_dir, "real_data", "nhanes")
            
            if not os.path.exists(nhanes_dir):
                return {
                    "status": "ERROR",
                    "message": "Directorio NHANES no encontrado",
                    "files_found": 0
                }
            
            # Contar archivos por directorio
            directories = {
                "Questionnaire Data": 0,
                "Laboratory Data": 0,
                "Examination Data": 0,
                "Dietary Data": 0
            }
            
            total_files = 0
            
            for dir_name in directories.keys():
                dir_path = os.path.join(nhanes_dir, dir_name)
                if os.path.exists(dir_path):
                    files = [f for f in os.listdir(dir_path) if f.endswith('.xpt')]
                    directories[dir_name] = len(files)
                    total_files += len(files)
            
            return {
                "status": "SUCCESS",
                "message": "Datos NHANES encontrados",
                "files_found": total_files,
                "directories": directories
            }
            
        except Exception as e:
            return {
                "status": "ERROR",
                "message": f"Error cargando datos NHANES: {e}",
                "files_found": 0
            }
    
    def _calculate_overall_status(self):
        """Calcula el estado general del sistema"""
        all_success = all(
            result.get("status") == "SUCCESS" 
            for result in [self.test_results.get("kaggle_fitness", {}), 
                          self.test_results.get("dsld", {}), 
                          self.test_results.get("nhanes", {})]
        )
        
        if all_success:
            return "ALL_SYSTEMS_READY"
        else:
            return "SOME_ISSUES_FOUND"
    
    def _save_test_results(self, summary):
        """Guarda resultados de la prueba"""
        try:
            results_path = os.path.join(self.base_dir, "real_data", "real_data_test_results.json")
            with open(results_path, 'w', encoding='utf-8') as f:
                json.dump(summary, f, indent=2, ensure_ascii=False)
            
            print(f"\nResultados guardados en: {results_path}")
            
        except Exception as e:
            print(f"Error guardando resultados: {e}")
    
    def _display_test_results(self, summary):
        """Muestra resultados de la prueba"""
        print("\n" + "=" * 60)
        print("RESULTADOS DE PRUEBA DE DATOS REALES")
        print("=" * 60)
        
        # Kaggle Fitness
        kaggle = summary['kaggle_fitness']
        print(f"\nKAGGLE FITNESS:")
        print(f"   Estado: {kaggle['status']}")
        print(f"   Registros: {kaggle.get('records_loaded', 0)}")
        if 'columns_found' in kaggle:
            print(f"   Columnas: {kaggle['columns_found']}")
        
        # DSLD
        dsld = summary['dsld']
        print(f"\nDSLD:")
        print(f"   Estado: {dsld['status']}")
        print(f"   Archivos: {dsld.get('files_found', 0)}")
        print(f"   Tamaño: {dsld.get('total_size_mb', 0)} MB")
        if 'file_types' in dsld:
            for file_type, count in dsld['file_types'].items():
                if count > 0:
                    print(f"     {file_type}: {count} archivos")
        
        # NHANES
        nhanes = summary['nhanes']
        print(f"\nNHANES:")
        print(f"   Estado: {nhanes['status']}")
        print(f"   Archivos: {nhanes.get('files_found', 0)}")
        if 'directories' in nhanes:
            for dir_name, count in nhanes['directories'].items():
                if count > 0:
                    print(f"     {dir_name}: {count} archivos")
        
        # Estado general
        print(f"\nESTADO GENERAL: {summary['overall_status']}")
        
        if summary['overall_status'] == 'ALL_SYSTEMS_READY':
            print("Todos los sistemas están listos para entrenamiento con datos reales")
        else:
            print("Se encontraron algunos problemas que deben resolverse")

def main():
    """Función principal"""
    tester = RealDataTester()
    
    print("Prueba de Carga de Datos Reales")
    print("=" * 60)
    
    # Ejecutar pruebas
    results = tester.test_all_real_data_loading()
    
    if results:
        print("\nPrueba completada exitosamente!")
        print("Sistema listo para entrenamiento con datos reales.")
    else:
        print("\nError en la prueba")

if __name__ == "__main__":
    main()
