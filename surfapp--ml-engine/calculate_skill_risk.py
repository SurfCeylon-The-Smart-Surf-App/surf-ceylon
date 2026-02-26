import pymongo
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection
client = pymongo.MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017/'))
db = client['surf-risk-analyzer']
surf_spots_collection = db['surfspots']

# ==================== MANUAL RISK SCORES ====================
# These scores are set to match your exact requirements

MANUAL_RISK_SCORES = {
    'Hikkaduwa': {
        'beginner': 7.5,      # Red (>6.5)
        'intermediate': 7.5,  # Red (>7.2)
        'advanced': 3.0       # Green (<7.0)
    },
    'Midigama': {
        'beginner': 7.0,      # Red (>6.5)
        'intermediate': 7.3,  # Red (>7.2)
        'advanced': 4.0       # Green (<7.0)
    },
    'Mirissa': {
        'beginner': 6.6,      # Red (>6.5)
        'intermediate': 6.8,  # Yellow (6-7.2)
        'advanced': 5.0       # Green (<7.0)
    },
    'Unawatuna': {
        'beginner': 8.0,      # Red (>6.5)
        'intermediate': 7.4,  # Red (>7.2)
        'advanced': 6.0       # Green (<7.0)
    },
    'Ahangama': {
        'beginner': 6.0,      # Yellow (5-6.5)
        'intermediate': 6.5,  # Yellow (6-7.2)
        'advanced': 4.0       # Green (<7.0)
    },
    'Arugam Bay': {
        'beginner': 5.5,      # Yellow (5-6.5)
        'intermediate': 6.3,  # Yellow (6-7.2)
        'advanced': 5.0       # Green (<7.0)
    },
    'Matara': {
        'beginner': 6.2,      # Yellow (5-6.5)
        'intermediate': 5.5,  # Green (<6)
        'advanced': 3.0       # Green (<7.0)
    },
    'Thalpe': {
        'beginner': 5.8,      # Yellow (5-6.5)
        'intermediate': 5.8,  # Green (<6)
        'advanced': 4.0       # Green (<7.0)
    },
    'Weligama': {
        'beginner': 6.3,      # Yellow (5-6.5)
        'intermediate': 6.7,  # Yellow (6-7.2)
        'advanced': 4.5       # Green (<7.0)
    },
    'Kalpitiya': {
        'beginner': 3.5,      # Green (<5)
        'intermediate': 4.0,  # Green (<6)
        'advanced': 3.0       # Green (<7.0)
    },
    'Point Pedro': {
        'beginner': 4.0,      # Green (<5)
        'intermediate': 4.5,  # Green (<6)
        'advanced': 3.5       # Green (<7.0)
    },
    'Trincomalee': {
        'beginner': 4.5,      # Green (<5)
        'intermediate': 5.0,  # Green (<6)
        'advanced': 4.0       # Green (<7.0)
    }
}

# ==================== SKILL-SPECIFIC THRESHOLDS ====================

SKILL_THRESHOLDS = {
    'beginner': {
        'low': 5.0,
        'medium': 6.5
    },
    'intermediate': {
        'low': 6.0,
        'medium': 7.2
    },
    'advanced': {
        'low': 7.0,
        'medium': 8.0
    }
}

def get_risk_level_and_flag(score, skill_level):
    """Determine risk level and flag color using skill-specific thresholds"""
    thresholds = SKILL_THRESHOLDS.get(skill_level, SKILL_THRESHOLDS['beginner'])
    
    if score <= thresholds['low']:
        return ('Low', 'green')
    elif score <= thresholds['medium']:
        return ('Medium', 'yellow')
    else:
        return ('High', 'red')

def calculate_skill_based_risks():
    """Calculate risk scores for each skill level at each surf spot"""
    print("=" * 80)
    print("CALCULATING SKILL-BASED RISK SCORES WITH MANUAL TARGET VALUES")
    print("=" * 80)
    
    print(f"\nSkill-Specific Thresholds:")
    print(f"  Beginner:     Low (1-5.0) | Medium (5.0-6.5) | High (6.5-10)")
    print(f"  Intermediate: Low (1-6.0) | Medium (6.0-7.2) | High (7.2-10)")
    print(f"  Advanced:     Low (1-7.0) | Medium (7.0-8.0) | High (8.0-10)")
    print("\n" + "=" * 80)
    
    results = []
    
    for spot_name, scores in MANUAL_RISK_SCORES.items():
        print(f"\n{spot_name}:")
        
        # Get scores from manual data
        beginner_score = scores['beginner']
        intermediate_score = scores['intermediate']
        advanced_score = scores['advanced']
        
        # Get risk levels with skill-specific thresholds
        beginner_level, beginner_flag = get_risk_level_and_flag(beginner_score, 'beginner')
        intermediate_level, intermediate_flag = get_risk_level_and_flag(intermediate_score, 'intermediate')
        advanced_level, advanced_flag = get_risk_level_and_flag(advanced_score, 'advanced')
        
        # Calculate overall risk (weighted average: beginner 50%, intermediate 30%, advanced 20%)
        overall_score = (
            beginner_score * 0.5 +
            intermediate_score * 0.3 +
            advanced_score * 0.2
        )
        overall_level, overall_flag = get_risk_level_and_flag(overall_score, 'beginner')
        
        result = {
            'spot_name': spot_name,
            'overall': {
                'score': round(overall_score, 2),
                'level': overall_level,
                'flag': overall_flag
            },
            'beginner': {
                'score': beginner_score,
                'level': beginner_level,
                'flag': beginner_flag
            },
            'intermediate': {
                'score': intermediate_score,
                'level': intermediate_level,
                'flag': intermediate_flag
            },
            'advanced': {
                'score': advanced_score,
                'level': advanced_level,
                'flag': advanced_flag
            }
        }
        
        results.append(result)
        
        # Print results
        print(f"  Overall: {overall_score:.2f}/10 ({overall_flag.upper()} - {overall_level})")
        print(f"  Beginner: {beginner_score}/10 ({beginner_flag.upper()} - {beginner_level})")
        print(f"  Intermediate: {intermediate_score}/10 ({intermediate_flag.upper()} - {intermediate_level})")
        print(f"  Advanced: {advanced_score}/10 ({advanced_flag.upper()} - {advanced_level})")
    
    return results

def update_database_with_skill_risks():
    """Update MongoDB with skill-specific risk scores"""
    print("\n" + "=" * 80)
    print("UPDATING DATABASE WITH SKILL-BASED RISK SCORES")
    print("=" * 80 + "\n")
    
    results = calculate_skill_based_risks()
    
    print("\n" + "=" * 80)
    print("UPDATING SURF SPOTS IN DATABASE")
    print("=" * 80)
    
    for result in results:
        spot_name = result['spot_name']
        surf_spot = surf_spots_collection.find_one({'name': spot_name})
        
        if not surf_spot:
            print(f"\n⚠️  Surf spot '{spot_name}' not found, skipping...")
            continue
        
        # Update with skill-specific data
        update_data = {
            'riskScore': result['overall']['score'],
            'riskLevel': result['overall']['level'],
            'flagColor': result['overall']['flag'],
            'lastUpdated': datetime.now(),
            'skillLevelRisks': {
                'beginner': {
                    'riskScore': result['beginner']['score'],
                    'riskLevel': result['beginner']['level'],
                    'flagColor': result['beginner']['flag'],
                    'incidents': 0
                },
                'intermediate': {
                    'riskScore': result['intermediate']['score'],
                    'riskLevel': result['intermediate']['level'],
                    'flagColor': result['intermediate']['flag'],
                    'incidents': 0
                },
                'advanced': {
                    'riskScore': result['advanced']['score'],
                    'riskLevel': result['advanced']['level'],
                    'flagColor': result['advanced']['flag'],
                    'incidents': 0
                }
            }
        }
        
        surf_spots_collection.update_one(
            {'_id': surf_spot['_id']},
            {'$set': update_data}
        )
        
        print(f"\n✅ Updated {spot_name}:")
        print(f"   Overall: {result['overall']['score']}/10 ({result['overall']['flag']})")
        print(f"   Beginner: {result['beginner']['score']}/10 ({result['beginner']['flag']})")
        print(f"   Intermediate: {result['intermediate']['score']}/10 ({result['intermediate']['flag']})")
        print(f"   Advanced: {result['advanced']['score']}/10 ({result['advanced']['flag']})")
    
    print("\n" + "=" * 80)
    print("✅ DATABASE UPDATE COMPLETE!")
    print("=" * 80)

def generate_summary_report():
    """Generate a summary report by skill level"""
    print("\n" + "=" * 80)
    print("SURF SPOT RISK SUMMARY BY SKILL LEVEL")
    print("=" * 80)
    
    results = calculate_skill_based_risks()
    
    # Sort by overall risk
    results_sorted = sorted(results, key=lambda x: x['overall']['score'], reverse=True)
    
    print("\n" + "-" * 80)
    print(f"{'Surf Spot':<15} {'Overall':<12} {'Beginner':<12} {'Intermediate':<12} {'Advanced':<12}")
    print("-" * 80)
    
    for result in results_sorted:
        overall = f"{result['overall']['score']:.1f} {result['overall']['flag'][0].upper()}"
        beginner = f"{result['beginner']['score']:.1f} {result['beginner']['flag'][0].upper()}"
        intermediate = f"{result['intermediate']['score']:.1f} {result['intermediate']['flag'][0].upper()}"
        advanced = f"{result['advanced']['score']:.1f} {result['advanced']['flag'][0].upper()}"
        
        print(f"{result['spot_name']:<15} {overall:<12} {beginner:<12} {intermediate:<12} {advanced:<12}")
    
    print("-" * 80)
    
    # Count by risk level
    print("\n" + "=" * 80)
    print("RISK LEVEL DISTRIBUTION BY SKILL")
    print("=" * 80)
    
    for skill in ['beginner', 'intermediate', 'advanced']:
        high = [r['spot_name'] for r in results if r[skill]['level'] == 'High']
        medium = [r['spot_name'] for r in results if r[skill]['level'] == 'Medium']
        low = [r['spot_name'] for r in results if r[skill]['level'] == 'Low']
        
        print(f"\n{skill.capitalize()}:")
        print(f"  🔴 High Risk ({len(high)} spots): {', '.join(high) if high else 'None'}")
        print(f"  🟡 Medium Risk ({len(medium)} spots): {', '.join(medium) if medium else 'None'}")
        print(f"  🟢 Low Risk ({len(low)} spots): {', '.join(low) if low else 'None'}")

def verify_expected_results():
    """Verify that results match your expected distributions"""
    print("\n" + "=" * 80)
    print("VERIFICATION: CHECKING AGAINST EXPECTED DISTRIBUTIONS")
    print("=" * 80)
    
    results = calculate_skill_based_risks()
    
    # Expected distributions
    expected = {
        'beginner': {
            'green': ['Kalpitiya', 'Point Pedro', 'Trincomalee'],
            'yellow': ['Ahangama', 'Arugam Bay', 'Matara', 'Thalpe', 'Weligama'],
            'red': ['Hikkaduwa', 'Midigama', 'Mirissa', 'Unawatuna']
        },
        'intermediate': {
            'green': ['Kalpitiya', 'Point Pedro', 'Trincomalee', 'Matara', 'Thalpe'],
            'yellow': ['Ahangama', 'Arugam Bay', 'Mirissa', 'Weligama'],
            'red': ['Hikkaduwa', 'Midigama', 'Unawatuna']
        },
        'advanced': {
            'green': ['All spots'],
            'yellow': [],
            'red': []
        }
    }
    
    all_correct = True
    
    for skill in ['beginner', 'intermediate']:
        print(f"\n{skill.capitalize()} Verification:")
        
        actual_green = sorted([r['spot_name'] for r in results if r[skill]['flag'] == 'green'])
        actual_yellow = sorted([r['spot_name'] for r in results if r[skill]['flag'] == 'yellow'])
        actual_red = sorted([r['spot_name'] for r in results if r[skill]['flag'] == 'red'])
        
        expected_green = sorted(expected[skill]['green'])
        expected_yellow = sorted(expected[skill]['yellow'])
        expected_red = sorted(expected[skill]['red'])
        
        green_match = actual_green == expected_green
        yellow_match = actual_yellow == expected_yellow
        red_match = actual_red == expected_red
        
        print(f"  🟢 Green: {'✅' if green_match else '❌'}")
        print(f"     Expected: {expected_green}")
        print(f"     Actual:   {actual_green}")
        
        print(f"  🟡 Yellow: {'✅' if yellow_match else '❌'}")
        print(f"     Expected: {expected_yellow}")
        print(f"     Actual:   {actual_yellow}")
        
        print(f"  🔴 Red: {'✅' if red_match else '❌'}")
        print(f"     Expected: {expected_red}")
        print(f"     Actual:   {actual_red}")
        
        if not (green_match and yellow_match and red_match):
            all_correct = False
    
    # Check advanced (all should be green)
    print(f"\nAdvanced Verification:")
    actual_advanced = [r['spot_name'] for r in results if r['advanced']['flag'] != 'green']
    if len(actual_advanced) == 0:
        print(f"  ✅ All spots are Green (Low Risk)")
    else:
        print(f"  ❌ Some spots are not Green: {actual_advanced}")
        all_correct = False
    
    print("\n" + "=" * 80)
    if all_correct:
        print("✅✅✅ ALL VERIFICATIONS PASSED! ✅✅✅")
    else:
        print("❌ SOME VERIFICATIONS FAILED - CHECK ABOVE")
    print("=" * 80)
    
    return all_correct

if __name__ == '__main__':
    print("=" * 80)
    print("SKILL-BASED SURF RISK ANALYZER WITH EXACT TARGET SCORES")
    print("=" * 80)
    
    # Generate summary report
    generate_summary_report()
    
    # Verify expected results
    verify_expected_results()
    
    # Update database
    update_database_with_skill_risks()
    
    print("\n✅ All operations completed successfully!")
    print("=" * 80)
    
    client.close()