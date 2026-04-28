import csv, random

random.seed(42)

OUT = "/Users/marvade/Projects/Retail-Insights-Dashboard/test_data_20k.csv"

SUPPLIERS_APPROVED = ["BWG Foods", "Musgrave", "Barry Group"]
SUPPLIERS_LOCAL = ["O'Brien's Local Supply", "Murphy's Farm Direct", "Fitzgerald Wholesale",
                   "Galway Bay Traders", "Cork Direct Imports", "Limerick Food Co"]

DEPTS = {
    "Off Licence": {
        "count": 2500, "cost": (3, 35), "margin": (0.18, 0.35),
        "categories": {
            "Wine": ["Casillero del Diablo Cab Sauv", "Campo Viejo Rioja", "Oyster Bay Sauv Blanc", "Yellow Tail Shiraz", "Santa Rita 120 Merlot", "Trivento Malbec", "Barefoot Pinot Grigio", "Echo Falls Rose", "Blossom Hill White Zin", "Hardy's Stamp Shiraz"],
            "Beer": ["Guinness Draught", "Heineken", "Bulmers Original", "Smithwick's Red Ale", "Hop House 13", "Rockshore Lager", "Carlsberg Pilsner", "Budweiser", "Corona Extra", "Peroni Nastro Azzurro"],
            "Spirits": ["Jameson Irish Whiskey", "Powers Gold Label", "Paddy Irish Whiskey", "Tullamore DEW", "Redbreast 12yr", "Gordon's Gin", "Smirnoff Vodka", "Captain Morgan Rum", "Absolut Vodka", "Bacardi White Rum"],
            "Mixers": ["Schweppes Tonic Water", "Club Orange", "Britvic Ginger Ale", "Fever-Tree Tonic", "Schweppes Soda Water", "Coca-Cola Mixer", "Ballygowan Sparkling", "Thomas Henry Tonic", "Fentimans Ginger Beer", "Schweppes Lemonade"],
        }
    },
    "Grocery": {
        "count": 4000, "cost": (0.5, 8), "margin": (0.20, 0.40),
        "categories": {
            "Canned Goods": ["Batchelors Beans", "Heinz Tomato Soup", "Batchelors Peas", "Heinz Spaghetti", "Erin Soup", "Chef Brown Sauce", "Batchelors Mushy Peas", "Heinz Beanz", "Ambrosia Custard", "Baxters Soup"],
            "Pasta & Rice": ["Barilla Spaghetti", "De Cecco Penne", "Flahavan's Porridge Oats", "Uncle Ben's Rice", "Tilda Basmati", "Odlums Flour", "Napolina Fusilli", "Riviana Long Grain", "Amoy Noodles", "Sharwood's Rice"],
            "Sauces": ["Dolmio Bolognese", "Chef Ketchup", "Ballymaloe Relish", "Hellmann's Mayo", "HP Sauce", "Tabasco Original", "Lea & Perrins", "McDonnells Curry", "Knorr Stock Pot", "Oxo Cubes"],
            "Cereals": ["Flahavan's Progress Oatlets", "Kellogg's Corn Flakes", "Weetabix", "Cheerios", "Crunchy Nut", "Porridge Oats", "Rice Krispies", "Bran Flakes", "Alpen Muesli", "Granola"],
            "Baking": ["Odlums Self Raising Flour", "Siucra Caster Sugar", "Dr Oetker Baking Powder", "Shamrock Icing Sugar", "Stork Margarine", "Silver Spoon Sugar", "Whitworth's Ground Almonds", "Billington's Brown Sugar", "Nielsen-Massey Vanilla", "Green's Cake Mix"],
        }
    },
    "Dairy": {
        "count": 1500, "cost": (0.8, 6), "margin": (0.15, 0.30),
        "categories": {
            "Milk": ["Avonmore Full Cream", "Avonmore Low Fat", "Avonmore Super Milk", "Glenisk Organic Milk", "Lacto Free Milk", "Avonmore Buttermilk", "Premier Milk", "Dawn Fresh Milk", "Oat Milk Alpro", "Soya Milk Alpro"],
            "Cheese": ["Kerrygold Cheddar", "Dubliner Cheese", "Kilmeaden Vintage", "Cashel Blue", "Wexford Creamery Red", "Charleville Cheddar", "Cathedral City", "Philadelphia Cream", "Boursin Garlic", "Babybel Mini"],
            "Yogurt": ["Glenisk Organic Yogurt", "Yoplait Petit Filous", "Muller Corner", "Activia Natural", "Danone Actimel", "Onken Natural", "Total Greek", "Benecol Yogurt", "Yakult Original", "Alpro Soya Yogurt"],
            "Butter": ["Kerrygold Butter", "Dairygold Spread", "Kerrygold Softer Butter", "Flora Original", "Connacht Gold", "Bertolli Olive Spread", "Lurpak Butter", "Anchor Butter", "Country Life Butter", "Clover Spread"],
        }
    },
    "Deli": {
        "count": 1200, "cost": (1, 8), "margin": (0.30, 0.55),
        "categories": {
            "Cooked Meats": ["Brady Ham", "Clonakilty Black Pudding", "Galtee Rashers", "Denny Sausages", "Shaws Cooked Ham", "Oakpark Chicken Slices", "Kerry Foods Turkey", "Denny Gold Medal", "Galtee Cheese Slices", "Brady Roast Beef"],
            "Salads": ["Cully & Sully Soup", "Fresh Coleslaw", "Potato Salad", "Caesar Salad Bowl", "Greek Salad", "Pasta Salad", "Beetroot Salad", "Waldorf Salad", "Quinoa Bowl", "Superfood Salad"],
            "Prepared Foods": ["Deli Chicken Fillet Roll", "Breakfast Roll", "Wedges Large", "Soup of the Day", "Hot Dog", "Sausage Roll", "Chicken Goujons", "Garlic Bread", "Pizza Slice", "Panini Ham & Cheese"],
            "Sandwiches": ["BLT on White", "Chicken Caesar Wrap", "Egg Mayo Sandwich", "Tuna Melt", "Club Sandwich", "Ham & Cheese Toastie", "Veggie Wrap", "Turkey Cranberry", "Prawn Marie Rose", "Falafel Wrap"],
        }
    },
    "Bakery": {
        "count": 800, "cost": (0.5, 5), "margin": (0.35, 0.60),
        "categories": {
            "Bread": ["Brennans White Sliced", "Brennans Wholemeal", "Johnston Mooney Batch", "Pat the Baker Sliced", "McCambridge's Brown Bread", "Cuisine de France Baguette", "Brennans Family Pan", "Hovis Wholemeal", "Kingsmill 50/50", "Brennans Brown Soda"],
            "Rolls": ["Cuisine de France White Roll", "Sourdough Roll", "Ciabatta Roll", "Brioche Bun", "Sesame Seed Roll", "Wholemeal Roll", "Tiger Roll", "Poppy Seed Roll", "Crusty Batch Roll", "Floury Bap"],
            "Cakes": ["Mr Kipling Angel Slices", "Cadbury Mini Rolls", "Lyons Bakery Swiss Roll", "Madeira Cake", "Carrot Cake Slice", "Scone Plain", "Scone Fruit", "Danish Pastry", "Croissant Butter", "Pain au Chocolat"],
        }
    },
    "Produce": {
        "count": 1000, "cost": (0.3, 5), "margin": (0.25, 0.50),
        "categories": {
            "Fruit": ["Bananas Loose", "Gala Apples", "Satsumas Net", "Strawberries Punnet", "Blueberries", "Grapes Red Seedless", "Lemons", "Limes", "Avocado", "Kiwi Fruit"],
            "Vegetables": ["Rooster Potatoes 2kg", "Carrots 1kg", "Onions Brown 1kg", "Broccoli Head", "Mushrooms Button", "Tomatoes Vine", "Peppers Mixed", "Courgette", "Cucumber", "Iceberg Lettuce"],
            "Herbs": ["Fresh Basil Pot", "Fresh Coriander", "Fresh Parsley", "Fresh Mint", "Fresh Rosemary", "Fresh Thyme", "Fresh Chives", "Fresh Dill", "Garlic Bulb", "Ginger Root"],
        }
    },
    "Drinks": {
        "count": 1500, "cost": (0.4, 4), "margin": (0.25, 0.45),
        "categories": {
            "Soft Drinks": ["Coca-Cola 500ml", "Club Orange 500ml", "Fanta Orange 500ml", "7Up 500ml", "Pepsi 500ml", "Lucozade Original", "Club Lemon 500ml", "Sprite 500ml", "TK Red Lemonade", "Cidona"],
            "Juices": ["Tropicana Orange", "Innocent Smoothie", "Copella Apple", "Del Monte Orange", "Sqeez Orange", "Fruice Apple", "Ribena Blackcurrant", "Capri-Sun Orange", "Um Bongo", "Oasis Citrus"],
            "Water": ["Ballygowan Still 500ml", "Ballygowan Sparkling", "Volvic Natural", "Evian 500ml", "Deep RiverRock", "Kerry Spring", "Highland Spring", "Tipperary Water", "Vittel", "San Pellegrino"],
            "Energy Drinks": ["Red Bull 250ml", "Monster Energy", "Lucozade Sport", "Boost Original", "Carabao", "Reign Energy", "Emerge", "Rockstar", "Prime Hydration", "Monster Ultra"],
        }
    },
    "Snacks": {
        "count": 2000, "cost": (0.3, 4), "margin": (0.30, 0.50),
        "categories": {
            "Crisps": ["Tayto Cheese & Onion", "King Cheese & Onion", "Hunky Dorys Buffalo", "Pringles Original", "Walkers Ready Salted", "Tayto Salt & Vinegar", "Doritos Cool Original", "Kettle Chips Sea Salt", "Meanies", "Snax Crisps"],
            "Chocolate": ["Cadbury Dairy Milk", "Cadbury Twirl", "Mars Bar", "Snickers", "KitKat", "Maltesers", "Cadbury Timeout", "Cadbury Boost", "Wispa", "Crunchie"],
            "Sweets": ["Maynards Wine Gums", "Haribo Starmix", "Skittles Original", "Refreshers", "Drumstick Lollies", "Fruit Pastilles", "Jelly Babies", "Millions Strawberry", "Wham Bar", "Dip Dab"],
            "Nuts": ["KP Dry Roasted Peanuts", "Emerald Mixed Nuts", "Cashews Salted", "Almonds Natural", "Pistachios Roasted", "Macadamia Nuts", "Pecan Halves", "Walnuts", "Brazil Nuts", "Trail Mix"],
            "Biscuits": ["Jacob's Cream Crackers", "Mikado", "Kimberley", "Coconut Cream", "Rich Tea", "Digestive", "HobNobs", "Custard Cream", "Bourbon Cream", "Fig Roll"],
        }
    },
    "Frozen": {
        "count": 1500, "cost": (1, 8), "margin": (0.20, 0.40),
        "categories": {
            "Frozen Meals": ["Goodfella's Pizza", "Chicago Town Pizza", "Birds Eye Fish Fingers", "McCain Oven Chips", "Donegal Catch Fish", "Green Isle Dinner", "Birds Eye Chicken Dippers", "Aunt Bessie's Roasties", "Findus Crispy Pancakes", "Birdseye Peas"],
            "Ice Cream": ["HB Magnum Classic", "Ben & Jerry's Cookie Dough", "HB Cornetto", "Haagen-Dazs Vanilla", "HB Brunch", "Viennetta", "Carte D'Or Vanilla", "Solero Exotic", "Fab Lolly", "Loop the Loop"],
            "Frozen Veg": ["Green Isle Garden Peas", "Birds Eye Sweetcorn", "Green Isle Mixed Veg", "Birds Eye Broccoli", "McCain Stir Fry Veg", "Green Isle Spinach", "Birds Eye Cauliflower", "Green Isle Carrots", "Edamame Beans", "Frozen Berries Mix"],
        }
    },
    "Chilled": {
        "count": 1000, "cost": (1.5, 7), "margin": (0.25, 0.45),
        "categories": {
            "Ready Meals": ["Cully & Sully Pie", "Keelings Stir Fry", "Brady Family Ham", "Mash Direct Champ", "Clonakilty Sausages", "Good4U Salad", "Freshways Sandwich", "O'Brien's Wrap", "Zumo Smoothie", "Innocent Pot"],
            "Fresh Pasta": ["Rana Tortellini", "Giovanni Rana Ravioli", "Fresh Tagliatelle", "Gnocchi Fresh", "Fresh Lasagne Sheets", "Pesto Genovese Fresh", "Carbonara Sauce Fresh", "Arrabbiata Fresh", "Fresh Penne", "Stuffed Shells"],
            "Dips": ["Hummus Classic", "Guacamole Fresh", "Salsa Tomato", "Tzatziki", "Beetroot Hummus", "Sour Cream & Chive", "Caramelised Onion Dip", "Peri Peri Hummus", "Baba Ganoush", "Red Pepper Hummus"],
        }
    },
    "Household": {
        "count": 1500, "cost": (1, 10), "margin": (0.25, 0.45),
        "categories": {
            "Cleaning": ["Fairy Washing Up Liquid", "Dettol Spray", "Flash All Purpose", "Domestos Bleach", "Cif Cream", "Mr Muscle Kitchen", "Harpic Power Plus", "Cillit Bang", "Windolene Glass", "Pledge Furniture"],
            "Laundry": ["Persil Bio Capsules", "Comfort Fabric Softener", "Daz Washing Powder", "Bold 2in1", "Lenor Unstoppables", "Vanish Oxi Action", "Surf Tropical", "Fairy Non-Bio", "Ariel Pods", "Ecover Laundry"],
            "Kitchen": ["Bacofoil Tin Foil", "Cling Film", "Kitchen Roll Regina", "Bin Bags 50L", "Zip Firelighters", "Bord na Mona Briquettes", "Swan Matches", "Glad Wrap", "Food Bags Resealable", "Greaseproof Paper"],
            "Bathroom": ["Andrex Toilet Roll 9pk", "Kleenex Tissues", "Colgate Toothpaste", "Oral-B Toothbrush", "Dove Shower Gel", "Lynx Africa", "Head & Shoulders", "Palmolive Soap", "Nivea Moisturiser", "Gillette Razor"],
        }
    },
    "Non-Food": {
        "count": 1000, "cost": (1, 12), "margin": (0.30, 0.50),
        "categories": {
            "Batteries": ["Duracell AA 4pk", "Energizer AAA 4pk", "Duracell 9V", "Energizer C 2pk", "Duracell D 2pk", "Duracell AA 8pk", "Energizer Lithium AA", "Panasonic AA 4pk", "Duracell Plus AA", "Energizer Max AAA"],
            "Stationery": ["Bic Biro Blue", "Pritt Stick", "Sellotape", "A4 Refill Pad", "Highlighter Yellow", "Sharpie Black", "Post-It Notes", "Paperclips Box", "Stapler Mini", "Envelope White C5"],
            "Pet Food": ["Whiskas Cat Food", "Pedigree Dog Food", "Felix Cat Pouch", "Cesar Dog Tray", "Iams Cat Biscuits", "Bakers Dog Food", "Sheba Cat Food", "Winalot Dog", "Dreamies Cat Treats", "Dentastix Dog"],
            "Health": ["Panadol Tablets", "Nurofen Ibuprofen", "Lemsip Cold & Flu", "Strepsils Honey", "Sudocrem", "Savlon Cream", "Berocca Effervescent", "Rennie Antacid", "Gaviscon Liquid", "Vicks VapoRub"],
        }
    },
    "Tobacco": {
        "count": 300, "cost": (10, 15), "margin": (0.06, 0.10),
        "categories": {
            "Cigarettes": ["Silk Cut Purple", "Benson & Hedges Gold", "John Player Blue", "Marlboro Gold", "Camel Blue", "Lambert & Butler", "Mayfair King Size", "Rothmans Blue", "Embassy No.1", "Pall Mall Red"],
            "Rolling Tobacco": ["Amber Leaf 30g", "Golden Virginia 30g", "Drum Original", "Cutters Choice", "Old Holborn", "Sterling Rolling", "JPS Players Rolling", "Pueblo Blue", "American Spirit", "Manitou Organic"],
            "Vapes": ["Elf Bar 600", "Lost Mary BM600", "SKE Crystal Bar", "Geek Bar", "IVG Bar", "Elux Legend", "Nasty Fix Go", "Vuse Go 700", "Blu Bar", "RELX Pod"],
        }
    },
    "Newspapers": {
        "count": 200, "cost": (1, 5), "margin": (0.08, 0.15),
        "categories": {
            "Papers": ["Irish Independent", "Irish Times", "Irish Examiner", "Irish Daily Star", "Irish Sun", "Irish Daily Mirror", "Herald", "Sunday Independent", "Sunday World", "Farmers Journal"],
            "Magazines": ["RTE Guide", "VIP Magazine", "Irish Country Living", "Hot Press", "Image Magazine", "Woman's Way", "Ireland's Own", "Auto Trader", "Hello Magazine", "OK Magazine"],
        }
    },
}

def gen_ean13():
    digits = [5, 3, 9] + [random.randint(0, 9) for _ in range(9)]
    checksum = (10 - sum(d * (1 if i % 2 == 0 else 3) for i, d in enumerate(digits)) % 10) % 10
    return "".join(map(str, digits)) + str(checksum)

rows = []
used_skus = set()

for dept, cfg in DEPTS.items():
    cats = list(cfg["categories"].items())
    per_cat = cfg["count"] // len(cats)
    remainder = cfg["count"] - per_cat * len(cats)

    for ci, (cat, names) in enumerate(cats):
        n = per_cat + (1 if ci < remainder else 0)
        for i in range(n):
            sku = gen_ean13()
            while sku in used_skus:
                sku = gen_ean13()
            used_skus.add(sku)

            base = names[i % len(names)]
            suffix = f" {random.choice(['500ml','1L','250g','500g','1kg','6pk','4pk','12pk','200g','330ml','750ml','100g','150g','2pk','3pk'])}" if i >= len(names) else ""
            name = base + suffix

            cost = round(random.uniform(*cfg["cost"]), 2)

            r = random.random()
            if r < 0.02:  # 2% loss-making
                sell = round(cost * random.uniform(0.80, 0.98), 2)
            elif r < 0.17:  # 15% bad margin
                sell = round(cost * (1 + random.uniform(0.01, cfg["margin"][0] * 0.8)), 2)
            else:
                sell = round(cost * (1 + random.uniform(*cfg["margin"])), 2)

            if random.random() < 0.10:
                supplier = random.choice(SUPPLIERS_LOCAL)
                approved = "No"
            else:
                supplier = random.choice(SUPPLIERS_APPROVED)
                approved = "Yes"

            units = random.randint(0, 150)
            days_no = random.randint(6, 30) if random.random() < 0.08 else random.randint(0, 5)

            rows.append([sku, name, dept, cat, cost, sell, supplier, approved, units, days_no])

random.shuffle(rows)

with open(OUT, "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["sku","name","department","category","cost_price","selling_price","supplier","approved_supplier","units_sold_week","days_no_sale"])
    w.writerows(rows)

print(f"Generated {len(rows)} rows to {OUT}")
