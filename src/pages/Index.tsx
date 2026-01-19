import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Shot {
  x: number;
  y: number;
  points: number;
  timestamp: number;
  isMiss: boolean;
}

interface LeaderboardEntry {
  id?: number;
  first_name: string;
  last_name: string;
  study_group: string;
  score: number;
  accuracy: number;
  total_shots: number;
  hits: number;
  misses: number;
  game_duration: number;
  created_at?: string;
}

interface Participant {
  firstName: string;
  lastName: string;
  group: string;
}

const API_URL = 'https://functions.poehali.dev/bb073398-0eed-4423-8001-949ec80c2137';

const Index = () => {
  const [score, setScore] = useState(0);
  const [shots, setShots] = useState<Shot[]>([]);
  const [totalShots, setTotalShots] = useState(0);
  const [misses, setMisses] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [gameDuration, setGameDuration] = useState(6);
  const [timeLeft, setTimeLeft] = useState(60);
  const [showResult, setShowResult] = useState(false);
  const [showRegistration, setShowRegistration] = useState(true);
  const [participant, setParticipant] = useState<Participant>({ firstName: '', lastName: '', group: '' });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  useEffect(() => {
    if (gameActive && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && gameActive) {
      setGameActive(false);
      setShowResult(true);
      saveResult();
    }
  }, [gameActive, timeLeft]);

  const loadLeaderboard = async () => {
    try {
      const response = await fetch(`${API_URL}?limit=10`);
      const data = await response.json();
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  };

  const saveResult = async () => {
    const hits = totalShots - misses;
    const accuracy = totalShots > 0 ? Math.round((hits / totalShots) * 100) : 0;
    
    setSaving(true);
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: participant.firstName,
          lastName: participant.lastName,
          group: participant.group,
          score,
          totalShots,
          hits,
          misses,
          accuracy,
          gameDuration
        })
      });
      await loadLeaderboard();
    } catch (error) {
      console.error('Failed to save result:', error);
    } finally {
      setSaving(false);
    }
  };

  const startGame = () => {
    if (!participant.firstName || !participant.lastName || !participant.group) {
      return;
    }
    setScore(0);
    setShots([]);
    setTotalShots(0);
    setMisses(0);
    setTimeLeft(gameDuration);
    setGameActive(true);
    setShowResult(false);
    setShowRegistration(false);
  };

  const resetToRegistration = () => {
    setShowRegistration(true);
    setGameActive(false);
    setShowResult(false);
    setScore(0);
    setShots([]);
    setTotalShots(0);
    setMisses(0);
  };

  const handleTargetClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!gameActive) return;

    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const centerX = 50;
    const centerY = 50;
    const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));

    let points = 0;
    let isMiss = false;
    
    if (distance < 8) points = 100;
    else if (distance < 16) points = 80;
    else if (distance < 24) points = 60;
    else if (distance < 32) points = 40;
    else if (distance < 40) points = 20;
    else {
      points = 0;
      isMiss = true;
      setMisses(prev => prev + 1);
    }

    if (!isMiss) {
      setScore(prev => prev + points);
    }
    
    setTotalShots(prev => prev + 1);
    
    const timestamp = Date.now();
    setShots(prev => [...prev, { x, y, points, timestamp, isMiss }]);

    setTimeout(() => {
      setShots(prev => prev.filter(shot => shot.timestamp !== timestamp));
    }, 1000);
  };

  const hits = totalShots - misses;
  const accuracy = totalShots > 0 ? Math.round((hits / totalShots) * 100) : 0;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-7xl font-bold text-primary mb-2 tracking-tight">
            ЭЛЕКТРОННЫЙ ТИР
          </h1>
          <p className="text-xl text-muted-foreground">Волгоградская академия МВД России</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card className="p-6 bg-card border-2 border-border">
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary">{score}</div>
                    <div className="text-sm text-muted-foreground">ОЧКИ</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-secondary">{totalShots}</div>
                    <div className="text-sm text-muted-foreground">ВЫСТРЕЛЫ</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-accent">{accuracy}%</div>
                    <div className="text-sm text-muted-foreground">ТОЧНОСТЬ</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-destructive">{misses}</div>
                    <div className="text-sm text-muted-foreground">ПРОМАХИ</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-foreground">{timeLeft}s</div>
                  <div className="text-sm text-muted-foreground">ВРЕМЯ</div>
                </div>
              </div>

              <Progress value={(timeLeft / gameDuration) * 100} className="mb-6 h-2" />

              <div className="relative aspect-square bg-gradient-to-br from-muted/50 to-background rounded-lg border-4 border-border overflow-hidden cursor-crosshair" onClick={handleTargetClick}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-[80%] h-[80%]">
                    <div className="absolute inset-0 rounded-full bg-primary/10 border-4 border-primary/30 flex items-center justify-center">
                      <div className="w-[80%] h-[80%] rounded-full bg-primary/10 border-4 border-primary/40 flex items-center justify-center">
                        <div className="w-[60%] h-[60%] rounded-full bg-primary/20 border-4 border-primary/50 flex items-center justify-center">
                          <div className="w-[40%] h-[40%] rounded-full bg-primary/30 border-4 border-primary/60 flex items-center justify-center">
                            <div className="w-[50%] h-[50%] rounded-full bg-primary border-4 border-primary flex items-center justify-center">
                              <Icon name="Crosshair" className="text-background" size={32} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {shots.map((shot, idx) => (
                  <div
                    key={idx}
                    className="absolute animate-ping"
                    style={{
                      left: `${shot.x}%`,
                      top: `${shot.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <div className={`rounded-full ${shot.isMiss ? 'bg-destructive' : shot.points >= 80 ? 'bg-primary' : shot.points >= 40 ? 'bg-secondary' : 'bg-accent'}`} style={{ width: '16px', height: '16px' }} />
                    <div className={`absolute -top-8 left-1/2 -translate-x-1/2 text-2xl font-bold whitespace-nowrap ${shot.isMiss ? 'text-destructive' : 'text-primary'}`}>
                      {shot.isMiss ? 'МИМО!' : `+${shot.points}`}
                    </div>
                  </div>
                ))}

                {!gameActive && !showResult && showRegistration && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm p-6">
                    <div className="text-center max-w-md w-full">
                      <h3 className="text-2xl font-bold mb-6">РЕГИСТРАЦИЯ УЧАСТНИКА</h3>
                      <div className="space-y-4 mb-6">
                        <div className="text-left">
                          <Label htmlFor="firstName" className="text-foreground mb-2 block">Имя</Label>
                          <Input 
                            id="firstName"
                            value={participant.firstName}
                            onChange={(e) => setParticipant(prev => ({ ...prev, firstName: e.target.value }))}
                            placeholder="Введите имя"
                            className="text-lg"
                          />
                        </div>
                        <div className="text-left">
                          <Label htmlFor="lastName" className="text-foreground mb-2 block">Фамилия</Label>
                          <Input 
                            id="lastName"
                            value={participant.lastName}
                            onChange={(e) => setParticipant(prev => ({ ...prev, lastName: e.target.value }))}
                            placeholder="Введите фамилию"
                            className="text-lg"
                          />
                        </div>
                        <div className="text-left">
                          <Label htmlFor="group" className="text-foreground mb-2 block">Учебная группа</Label>
                          <Input 
                            id="group"
                            value={participant.group}
                            onChange={(e) => setParticipant(prev => ({ ...prev, group: e.target.value }))}
                            placeholder="Например: 1-А"
                            className="text-lg"
                          />
                        </div>
                      </div>
                      <Button 
                        onClick={() => setShowRegistration(false)} 
                        size="lg" 
                        className="text-xl px-8 py-6 w-full"
                        disabled={!participant.firstName || !participant.lastName || !participant.group}
                      >
                        <Icon name="ChevronRight" className="mr-2" size={24} />
                        ПРОДОЛЖИТЬ
                      </Button>
                    </div>
                  </div>
                )}

                {!gameActive && !showResult && !showRegistration && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm">
                    <div className="text-center">
                      <div className="mb-6">
                        <div className="text-xl text-muted-foreground mb-2">Участник:</div>
                        <div className="text-2xl font-bold">{participant.firstName} {participant.lastName}</div>
                        <div className="text-lg text-muted-foreground">Группа: {participant.group}</div>
                      </div>
                      <h3 className="text-2xl font-bold mb-4">ВЫБЕРИ ВРЕМЯ ИГРЫ</h3>
                      <div className="flex gap-3 mb-6 justify-center">
                        <Button 
                          onClick={() => setGameDuration(4)} 
                          variant={gameDuration === 4 ? 'default' : 'outline'}
                          className="text-lg px-6 py-4"
                        >
                          4 сек
                        </Button>
                        <Button 
                          onClick={() => setGameDuration(6)} 
                          variant={gameDuration === 6 ? 'default' : 'outline'}
                          className="text-lg px-6 py-4"
                        >
                          6 сек
                        </Button>
                        <Button 
                          onClick={() => setGameDuration(10)} 
                          variant={gameDuration === 10 ? 'default' : 'outline'}
                          className="text-lg px-6 py-4"
                        >
                          10 сек
                        </Button>
                        <Button 
                          onClick={() => setGameDuration(12)} 
                          variant={gameDuration === 12 ? 'default' : 'outline'}
                          className="text-lg px-6 py-4"
                        >
                          12 сек
                        </Button>
                      </div>
                      <div className="flex gap-3 justify-center">
                        <Button onClick={resetToRegistration} variant="outline" size="lg" className="text-lg px-6 py-4">
                          <Icon name="UserX" className="mr-2" size={20} />
                          Сменить участника
                        </Button>
                        <Button onClick={startGame} size="lg" className="text-xl px-8 py-6">
                          <Icon name="Target" className="mr-2" size={24} />
                          НАЧАТЬ ИГРУ
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {showResult && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm">
                    <div className="text-center">
                      <h2 className="text-4xl font-bold mb-4">РЕЗУЛЬТАТ</h2>
                      <div className="text-2xl text-muted-foreground mb-2">
                        {participant.firstName} {participant.lastName}
                      </div>
                      <div className="text-lg text-muted-foreground mb-4">Группа: {participant.group}</div>
                      <div className="text-6xl font-bold text-primary mb-2">{score}</div>
                      <div className="text-2xl text-muted-foreground mb-2">
                        {totalShots} выстрелов • {hits} попаданий • {misses} промахов
                      </div>
                      <div className="text-3xl font-bold text-accent mb-2">
                        Точность: {accuracy}%
                      </div>
                      {saving && (
                        <div className="text-sm text-muted-foreground mb-4">Сохранение результата...</div>
                      )}
                      <div className="flex gap-3 justify-center">
                        <Button onClick={resetToRegistration} variant="outline" size="lg" className="text-lg px-6 py-4">
                          <Icon name="UserX" className="mr-2" size={20} />
                          Сменить участника
                        </Button>
                        <Button onClick={startGame} size="lg" className="text-xl px-8 py-6">
                          <Icon name="RotateCcw" className="mr-2" size={24} />
                          ИГРАТЬ СНОВА
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {!gameActive && (
                <div className="mt-4 text-center text-muted-foreground">
                  <p className="text-sm">Кликай по мишени! Чем ближе к центру — тем больше очков!</p>
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 bg-card border-2 border-border">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="Trophy" className="text-primary" size={24} />
                <h2 className="text-2xl font-bold">ТАБЛИЦА ЛИДЕРОВ</h2>
              </div>
              <div className="space-y-3">
                {leaderboard.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">Нет результатов</div>
                ) : (
                  leaderboard.map((entry, idx) => (
                    <div key={entry.id || idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <Badge variant={idx === 0 ? 'default' : 'secondary'} className="w-8 h-8 flex items-center justify-center text-lg font-bold">
                        {idx + 1}
                      </Badge>
                      <div className="flex-1">
                        <div className="font-semibold">{entry.first_name} {entry.last_name}</div>
                        <div className="text-xs text-muted-foreground">{entry.study_group}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-primary">{entry.score}</div>
                        <div className="text-xs text-muted-foreground">{entry.accuracy}%</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-6 bg-card border-2 border-border">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="Award" className="text-secondary" size={24} />
                <h2 className="text-2xl font-bold">ДОСТИЖЕНИЯ</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Icon name="Target" className="text-primary" size={32} />
                  <div className="flex-1">
                    <div className="font-semibold">Снайпер</div>
                    <div className="text-xs text-muted-foreground">10 попаданий в центр</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 opacity-50">
                  <Icon name="Zap" className="text-secondary" size={32} />
                  <div className="flex-1">
                    <div className="font-semibold">Скорострел</div>
                    <div className="text-xs text-muted-foreground">50 выстрелов за минуту</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 opacity-50">
                  <Icon name="Star" className="text-accent" size={32} />
                  <div className="flex-1">
                    <div className="font-semibold">Мастер</div>
                    <div className="text-xs text-muted-foreground">Набрать 1000 очков</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <Card className="p-6 bg-card border-2 border-border">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="BarChart3" className="text-accent" size={24} />
            <h2 className="text-2xl font-bold">СТАТИСТИКА СЕССИИ</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <Icon name="Crosshair" className="mx-auto mb-2 text-primary" size={32} />
              <div className="text-3xl font-bold">{totalShots}</div>
              <div className="text-sm text-muted-foreground">Всего выстрелов</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <Icon name="TrendingUp" className="mx-auto mb-2 text-secondary" size={32} />
              <div className="text-3xl font-bold">{score}</div>
              <div className="text-sm text-muted-foreground">Набрано очков</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <Icon name="Percent" className="mx-auto mb-2 text-accent" size={32} />
              <div className="text-3xl font-bold">{accuracy}%</div>
              <div className="text-sm text-muted-foreground">Точность</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <Icon name="XCircle" className="mx-auto mb-2 text-destructive" size={32} />
              <div className="text-3xl font-bold">{misses}</div>
              <div className="text-sm text-muted-foreground">Промахов</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Index;