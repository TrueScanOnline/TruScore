#!/usr/bin/env python3
"""
Populate FSANZ Database from Open Food Facts
Usage: python scripts/populateFSANZ.py --country NZ --limit 2000
"""

import json
import sys
import time
import urllib.request
import urllib.parse
import argparse

def fetch_products(country_code, limit):
    """Fetch products from Open Food Facts"""
    database = {}
    page = 1
    fetched = 0
    page_size = 100
    
    country_tag = 'en:new-zealand' if country_code == 'NZ' else 'en:australia'
    
    print(f"Fetching {country_code} products from Open Food Facts...")
    print(f"Target: {limit} products")
    print()
    
    while fetched < limit:
        try:
            url = f"https://world.openfoodfacts.org/cgi/search.pl?action=process&countries_tags={country_tag}&page_size={page_size}&page={page}&json=1&fields=code,product_name,product_name_en,brands,categories_tags,nutriments,ingredients_text"
            
            print(f"Fetching page {page}... ({fetched}/{limit} products)")
            
            req = urllib.request.Request(url, headers={'User-Agent': 'TrueScan-FoodScanner/1.0.0'})
            with urllib.request.urlopen(req, timeout=30) as response:
                data = json.loads(response.read().decode())
            
            if not data.get('products') or len(data['products']) == 0:
                print("No more products found")
                break
            
            for product in data['products']:
                if fetched >= limit:
                    break
                
                barcode = product.get('code')
                if not barcode or len(barcode) < 8:
                    continue
                
                product_name = product.get('product_name') or product.get('product_name_en') or f"Product {barcode}"
                if not product_name:
                    continue
                
                nutriments = product.get('nutriments', {})
                fsanz_product = {
                    'productName': product_name,
                    'country': country_code
                }
                
                if product.get('brands'):
                    fsanz_product['brand'] = product['brands'].split(',')[0].strip()
                
                if nutriments.get('energy-kcal_100g'):
                    fsanz_product['energyKcal'] = nutriments['energy-kcal_100g']
                elif nutriments.get('energy-kj_100g'):
                    fsanz_product['energyKcal'] = round(nutriments['energy-kj_100g'] / 4.184, 2)
                
                for key, fsanz_key in [
                    ('fat_100g', 'fat'),
                    ('saturated-fat_100g', 'saturatedFat'),
                    ('carbohydrates_100g', 'carbohydrates'),
                    ('sugars_100g', 'sugars'),
                    ('proteins_100g', 'protein'),
                    ('salt_100g', 'salt'),
                    ('sodium_100g', 'sodium'),
                    ('fiber_100g', 'dietaryFiber'),
                ]:
                    if nutriments.get(key):
                        fsanz_product[fsanz_key] = nutriments[key]
                
                if product.get('ingredients_text'):
                    fsanz_product['ingredients'] = product['ingredients_text']
                
                if product.get('categories_tags') and len(product['categories_tags']) > 0:
                    fsanz_product['categories'] = product['categories_tags'][:3]
                
                database[barcode] = fsanz_product
                fetched += 1
            
            print(f"  Fetched {len(data['products'])} products (total: {fetched})")
            
            if len(data['products']) < page_size:
                print("Reached end of available products")
                break
            
            page += 1
            time.sleep(1)  # Rate limiting
            
        except Exception as e:
            print(f"Error fetching page {page}: {e}")
            break
    
    return database

def main():
    parser = argparse.ArgumentParser(description='Populate FSANZ Database from Open Food Facts')
    parser.add_argument('--country', required=True, choices=['NZ', 'AU'], help='Country code')
    parser.add_argument('--limit', type=int, default=2000, help='Number of products to fetch')
    
    args = parser.parse_args()
    
    print("=" * 40)
    print(f"Populate FSANZ {args.country} Database")
    print("=" * 40)
    print()
    
    output_file = f"backend/vercel/data/fsanz-{args.country.lower()}.json"
    
    import os
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    database = fetch_products(args.country, args.limit)
    
    if len(database) == 0:
        print("No products found!")
        sys.exit(1)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(database, f, indent=2, ensure_ascii=False)
    
    file_size = os.path.getsize(output_file)
    
    print()
    print("=" * 40)
    print("✅ Conversion Complete!")
    print("=" * 40)
    print(f"   Country: {args.country}")
    print(f"   Products: {len(database):,}")
    print(f"   Output: {output_file}")
    print(f"   Size: {file_size / 1024 / 1024:.2f} MB")
    print()
    print("Next step: Deploy to Vercel")
    print("   cd backend\\vercel")
    print("   vercel --prod")
    print()

if __name__ == '__main__':
    main()
