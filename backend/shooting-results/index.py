import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    '''API для работы с результатами стрельбы: сохранение и получение топ результатов'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'DATABASE_URL not configured'})
        }
    
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    if method == 'POST':
        body = json.loads(event.get('body', '{}'))
        
        first_name = body.get('firstName', '')
        last_name = body.get('lastName', '')
        study_group = body.get('group', '')
        score = body.get('score', 0)
        total_shots = body.get('totalShots', 0)
        hits = body.get('hits', 0)
        misses = body.get('misses', 0)
        accuracy = body.get('accuracy', 0)
        game_duration = body.get('gameDuration', 0)
        
        cur.execute('''
            INSERT INTO shooting_results 
            (first_name, last_name, study_group, score, total_shots, hits, misses, accuracy, game_duration)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        ''', (first_name, last_name, study_group, score, total_shots, hits, misses, accuracy, game_duration))
        
        result = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'id': result['id'], 'message': 'Result saved successfully'})
        }
    
    elif method == 'GET':
        limit = int(event.get('queryStringParameters', {}).get('limit', 10))
        
        cur.execute('''
            SELECT 
                id,
                first_name,
                last_name,
                study_group,
                score,
                total_shots,
                hits,
                misses,
                accuracy,
                game_duration,
                created_at
            FROM shooting_results
            ORDER BY score DESC, accuracy DESC
            LIMIT %s
        ''', (limit,))
        
        results = cur.fetchall()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps([dict(row) for row in results], default=str)
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }
