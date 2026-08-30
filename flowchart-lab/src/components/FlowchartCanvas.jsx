import React, { useState, useEffect } from 'react';
import { 
  Play, Trash2, ArrowDown,
  Sparkles, Lightbulb, Award, Check, Plus, ArrowUp, RotateCcw,
  ArrowLeft, ArrowRight, CheckCircle2, ChevronLeft, ChevronRight
} from 'lucide-react';
import FlowchartShapeSvg from './FlowchartShapeSvg';
import { playSound } from '../utils/audio';

export const FlowchartCanvas = ({ 
  scenario, 
  onComplete, 
  soundEnabled = true 
}) => {
  // Available block pool from scenario (shuffled)
  const [availableBlocks, setAvailableBlocks] = useState([]);
  
  // Placed blocks on canvas
  const [placedNodes, setPlacedNodes] = useState([]);

  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeSimIndex, setActiveSimIndex] = useState(-1);
  const [simBranchChoice, setSimBranchChoice] = useState('YES'); // 'YES' or 'NO'
  const [simLogs, setSimLogs] = useState([]);

  // Reflection Questions State (Single Question Step-by-Step)
  const [reflectionAnswers, setReflectionAnswers] = useState({});
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

  // Evaluation Rubric & Submission Result
  const [rubricResult, setRubricResult] = useState(null);

  // Initialize blocks when scenario changes
  useEffect(() => {
    if (scenario && scenario.availableBlocks) {
      const shuffled = [...scenario.availableBlocks].sort(() => Math.random() - 0.5);
      setAvailableBlocks(shuffled);
      setPlacedNodes([]);
      setReflectionAnswers({});
      setCurrentQuestionIdx(0);
      setRubricResult(null);
      setSimLogs([]);
    }
  }, [scenario]);

  // Click to add block from available pool to canvas
  const handleAddBlockToCanvas = (block) => {
    playSound('drop', soundEnabled);
    setPlacedNodes(prev => [...prev, { ...block, instanceId: `node_${Date.now()}_${Math.random()}` }]);
    setAvailableBlocks(prev => prev.filter(b => b.id !== block.id));
  };

  // Remove block from canvas back to available pool
  const handleRemoveBlockFromCanvas = (node) => {
    playSound('click', soundEnabled);
    setPlacedNodes(prev => prev.filter(n => n.instanceId !== node.instanceId));
    setAvailableBlocks(prev => [...prev, { 
      id: node.id, 
      shape: node.shape, 
      text: node.text, 
      yesText: node.yesText, 
      noText: node.noText, 
      isCorrect: node.isCorrect, 
      correctOrder: node.correctOrder 
    }]);
  };

  // Move node up or down
  const handleMoveNode = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === placedNodes.length - 1) return;
    playSound('click', soundEnabled);
    const newNodes = [...placedNodes];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const temp = newNodes[index];
    newNodes[index] = newNodes[targetIdx];
    newNodes[targetIdx] = temp;
    setPlacedNodes(newNodes);
  };

  // Reset Canvas
  const handleResetCanvas = () => {
    playSound('click', soundEnabled);
    if (scenario && scenario.availableBlocks) {
      const shuffled = [...scenario.availableBlocks].sort(() => Math.random() - 0.5);
      setAvailableBlocks(shuffled);
      setPlacedNodes([]);
      setRubricResult(null);
      setSimLogs([]);
    }
  };

  // Run Flowchart Simulation
  const handleRunSimulation = () => {
    if (placedNodes.length === 0) {
      playSound('error', soundEnabled);
      alert('กรุณาเลือกบล็อกสัญลักษณ์ลงบนกระดานผังงานก่อนทดสอบรันครับ 😊');
      return;
    }
    playSound('click', soundEnabled);
    setIsSimulating(true);
    setActiveSimIndex(0);
    setSimLogs([`🚀 เริ่มต้นจำลองการรันผังงาน: "${scenario?.title || 'ผังงานของคุณ'}"`]);

    let step = 0;
    const interval = setInterval(() => {
      if (step < placedNodes.length) {
        const currentNode = placedNodes[step];
        setActiveSimIndex(step);
        playSound('step', soundEnabled);

        let logMsg = `▶️ [ขั้นที่ ${step + 1}] (${currentNode.shape}): ${currentNode.text}`;
        if (currentNode.shape === 'decision') {
          logMsg += ` ➔ ผลลัพธ์กิ่ง [${simBranchChoice}]: ${simBranchChoice === 'YES' ? (currentNode.yesText || 'จริง') : (currentNode.noText || 'เท็จ')}`;
        }
        setSimLogs(prev => [...prev, logMsg]);
        step++;
      } else {
        clearInterval(interval);
        playSound('success', soundEnabled);
        setSimLogs(prev => [...prev, '🏁 สิ้นสุดการทำงานของผังงาน (Execution Completed Successfully)']);
        setIsSimulating(false);
        setActiveSimIndex(-1);
      }
    }, 800);
  };

  // Select Multiple Choice Reflection Answer
  const handleSelectReflection = (questionId, optionIdx) => {
    playSound('click', soundEnabled);
    setReflectionAnswers(prev => ({ ...prev, [questionId]: optionIdx }));
  };

  // Evaluate Flowchart & Reflection Answers against Rubric (35 Points Max)
  const handleEvaluateAndSubmit = (e) => {
    e.preventDefault();

    if (placedNodes.length < 3) {
      playSound('error', soundEnabled);
      alert('ผังงานต้องประกอบด้วยบล็อกสัญลักษณ์อย่างน้อย 3 ขั้นตอน (เริ่มต้น, กระบวนการ/เงื่อนไข, สิ้นสุด) ครับ');
      return;
    }

    const refQuestions = scenario?.reflectionQuestions || [];
    const answeredCount = Object.keys(reflectionAnswers).length;
    if (answeredCount < refQuestions.length) {
      playSound('error', soundEnabled);
      alert(`กรุณาตอบคำถามสะท้อนคิดให้ครบทั้ง ${refQuestions.length} ข้อก่อนส่งประเมินผลครับ 😊`);
      return;
    }

    // 1. Check Flowchart Structural Correctness
    const hasStart = placedNodes[0]?.shape === 'terminator' && (placedNodes[0]?.text.includes('เริ่ม') || placedNodes[0]?.text.toLowerCase().includes('start'));
    const hasEnd = placedNodes[placedNodes.length - 1]?.shape === 'terminator' && (placedNodes[placedNodes.length - 1]?.text.includes('สิ้นสุด') || placedNodes[placedNodes.length - 1]?.text.toLowerCase().includes('end'));
    const hasDecision = placedNodes.some(n => n.shape === 'decision');
    const hasInvalidBlocks = placedNodes.some(n => n.isCorrect === false);

    // 2. Check Reflection Questions Accuracy
    let correctReflections = 0;
    refQuestions.forEach(q => {
      if (reflectionAnswers[q.id] === q.correctAnswer) {
        correctReflections += 1;
      }
    });

    // Rubric 5 Dimensions
    let scoreAnalysis = reflectionAnswers['rq1'] === refQuestions[0]?.correctAnswer ? 4 : 2;
    let scoreSequencing = (hasStart && hasEnd && !hasInvalidBlocks) ? 4 : (hasStart || hasEnd) ? 3 : 2;
    let scoreSymbols = (hasStart && hasEnd && hasDecision && !hasInvalidBlocks) ? 4 : 3;
    let scoreCorrectness = (!hasInvalidBlocks && hasDecision && placedNodes.length >= 4) ? 4 : 3;
    let scoreReflection = correctReflections === 4 ? 4 : correctReflections >= 2 ? 3 : 2;

    const rawTotal = scoreAnalysis + scoreSequencing + scoreSymbols + scoreCorrectness + scoreReflection;
    const finalScaledScore = Math.max(15, Math.round((rawTotal / 20) * 35));

    const rubricDetail = {
      analysis: { score: scoreAnalysis, max: 4, name: '1. การวิเคราะห์ปัญหา' },
      sequencing: { score: scoreSequencing, max: 4, name: '2. ลำดับขั้นตอน' },
      symbols: { score: scoreSymbols, max: 4, name: '3. การเลือกใช้สัญลักษณ์' },
      correctness: { score: scoreCorrectness, max: 4, name: '4. ความถูกต้องของผังงาน' },
      reflection: { score: scoreReflection, max: 4, name: '5. การประยุกต์ใช้และเหตุผล' },
      rawTotal,
      finalScore: finalScaledScore,
      maxFinalScore: 35
    };

    setRubricResult(rubricDetail);
    playSound('success', soundEnabled);

    if (onComplete) {
      onComplete(finalScaledScore, rubricDetail, { placedNodes, reflectionAnswers });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Modern Hero Scenario Card (Ultra-Clean White & Blue with Glow) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-blue-600/15 border border-white/20">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 -top-12 w-36 h-36 bg-sky-400/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center space-x-2 text-xs font-extrabold bg-white/15 backdrop-blur-md px-3.5 py-1 rounded-full w-fit mb-3 border border-white/25">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span className="tracking-wide">FINAL MISSION • FLOWCHART DESIGNER (35 คะแนน)</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black tracking-tight">{scenario?.title || 'ออกแบบผังงานตามโจทย์'}</h3>
          <p className="text-xs sm:text-sm text-blue-100/90 mt-2 leading-relaxed font-medium max-w-3xl">
            💡 <strong>สถานการณ์:</strong> {scenario?.description}
          </p>
        </div>
      </div>

      {/* Main Flowchart Assembly Studio (Grid Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Available Blocks Pool */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white/90 backdrop-blur-xl border border-blue-100/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                  🧩
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">คลังบล็อกคำสั่ง</h4>
                  <p className="text-[11px] text-slate-500 font-medium">คลิกบล็อกเพื่อนำไปต่อในผังงาน</p>
                </div>
              </div>

              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                เหลือ {availableBlocks.length} บล็อก
              </span>
            </div>

            {/* Available Blocks List */}
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {availableBlocks.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-blue-50/50 border border-dashed border-blue-200 text-xs text-blue-600 font-bold space-y-1">
                  <span className="text-2xl block">🎉</span>
                  <span>คุณนำบล็อกทั้งหมดไปวางบนผังงานแล้ว!</span>
                  <p className="text-[10px] text-slate-500 font-normal">สามารถปรับลำดับหรือกดรันผังงานได้ที่ฝั่งขวา</p>
                </div>
              ) : (
                availableBlocks.map((block) => (
                  <div
                    key={block.id}
                    onClick={() => handleAddBlockToCanvas(block)}
                    className="p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer transition-all duration-200 shadow-xs hover:shadow-md group flex items-center justify-between card-hover-effect"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-slate-50 rounded-xl p-1 group-hover:bg-blue-100/50 transition">
                        <FlowchartShapeSvg shape={block.shape} label="" />
                      </div>
                      <div>
                        <span className="text-[9.5px] uppercase font-extrabold text-blue-600 tracking-wider">
                          {block.shape === 'terminator' ? 'เริ่มต้น/สิ้นสุด' : block.shape === 'decision' ? 'ตรวจสอบเงื่อนไข' : block.shape === 'inputOutput' ? 'รับ/แสดงผล' : 'กระบวนการ'}
                        </span>
                        <h5 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 line-clamp-2">
                          {block.text}
                        </h5>
                      </div>
                    </div>

                    <button className="w-8 h-8 rounded-xl bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center transition shadow-2xs shrink-0">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Child-Friendly Pro Tip */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 text-[11px] text-amber-900 flex items-start space-x-2.5">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>เคล็ดลับ:</strong> วางบล็อก <strong>เริ่มต้น (Start)</strong> ไว้บนสุด ➔ ตามด้วยลำดับคำสั่ง ➔ แล้วจบด้วย <strong>สิ้นสุด (End)</strong>
              </div>
            </div>

          </div>
        </div>

        {/* Right: Flowchart Canvas Workspace */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white/90 backdrop-blur-xl border border-blue-100/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            
            {/* Top Canvas Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                  🎨
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">กระดานประกอบผังงาน</h4>
                  <p className="text-[11px] text-slate-500 font-medium">{placedNodes.length} บล็อกในผังงาน</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Branch Tester toggle for Decision */}
                <div className="flex items-center bg-slate-100/80 p-1 rounded-2xl text-xs font-bold border border-slate-200">
                  <span className="px-2 text-slate-500 text-[10.5px]">ทดสอบกิ่ง:</span>
                  <button
                    onClick={() => setSimBranchChoice('YES')}
                    className={`px-2.5 py-1 rounded-xl transition ${simBranchChoice === 'YES' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    YES (จริง)
                  </button>
                  <button
                    onClick={() => setSimBranchChoice('NO')}
                    className={`px-2.5 py-1 rounded-xl transition ${simBranchChoice === 'NO' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    NO (เท็จ)
                  </button>
                </div>

                {/* Run Simulation Button */}
                <button
                  onClick={handleRunSimulation}
                  disabled={isSimulating || placedNodes.length === 0}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-extrabold px-4 py-2 rounded-2xl text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 action-btn-hover"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isSimulating ? 'กำลังรัน...' : 'รันผังงาน'}</span>
                </button>

                {/* Reset Button */}
                <button
                  onClick={handleResetCanvas}
                  title="รีเซ็ตเริ่มใหม่"
                  className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Placed Blocks on Canvas Area */}
            <div className="min-h-[340px] bg-gradient-to-b from-slate-50/80 to-blue-50/30 border-2 border-dashed border-blue-200/80 rounded-3xl p-5 flex flex-col items-center justify-center">
              {placedNodes.length === 0 ? (
                <div className="text-center p-8 space-y-2">
                  <div className="w-16 h-16 rounded-3xl bg-white border border-blue-200 shadow-sm flex items-center justify-center text-3xl mx-auto text-blue-500">
                    📋
                  </div>
                  <p className="text-sm font-extrabold text-slate-700">กระดานผังงานยังว่างอยู่</p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    คลิกเลือกบล็อกสัญลักษณ์จากฝั่งซ้ายเพื่อเริ่มประกอบผังงานของคุณ
                  </p>
                </div>
              ) : (
                <div className="w-full max-w-md space-y-3 py-2">
                  {placedNodes.map((node, index) => {
                    const isCurrentSim = activeSimIndex === index;
                    return (
                      <React.Fragment key={node.instanceId}>
                        {index > 0 && (
                          <div className="flex flex-col items-center my-0.5">
                            <div className={`p-1 rounded-full ${isCurrentSim ? 'bg-amber-100 text-amber-600 animate-bounce' : 'text-blue-500'}`}>
                              <ArrowDown className="w-4 h-4 stroke-[3]" />
                            </div>
                          </div>
                        )}

                        <div className={`p-4 rounded-2xl border-2 transition-all duration-200 shadow-xs relative ${
                          isCurrentSim 
                            ? 'bg-amber-50/95 border-amber-500 ring-4 ring-amber-300/60 scale-105 shadow-md' 
                            : 'bg-white border-blue-100/90 hover:border-blue-300'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 shadow-xs">
                                {index + 1}
                              </span>
                              <div className="w-9 h-9 shrink-0 flex items-center justify-center">
                                <FlowchartShapeSvg shape={node.shape} label="" />
                              </div>
                              <div>
                                <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider">
                                  {node.shape}
                                </span>
                                <h5 className="text-xs font-bold text-slate-900 leading-snug">
                                  {node.text}
                                </h5>

                                {node.shape === 'decision' && (
                                  <div className="mt-1.5 flex flex-wrap gap-1 text-[10px] font-bold">
                                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                                      YES ➔ {node.yesText}
                                    </span>
                                    <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                                      NO ➔ {node.noText}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Node Controls */}
                            <div className="flex items-center space-x-1 shrink-0 ml-2">
                              <button
                                onClick={() => handleMoveNode(index, 'up')}
                                disabled={index === 0}
                                title="เลื่อนขึ้น"
                                className="p-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-25 text-slate-600 transition"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleMoveNode(index, 'down')}
                                disabled={index === placedNodes.length - 1}
                                title="เลื่อนลง"
                                className="p-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-25 text-slate-600 transition"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleRemoveBlockFromCanvas(node)}
                                title="นำออกจากกระดาน"
                                className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Simulation Log Console */}
            {simLogs.length > 0 && (
              <div className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs space-y-1 max-h-36 overflow-y-auto border border-slate-800 shadow-inner">
                <div className="text-[10px] text-slate-400 font-bold border-b border-slate-800 pb-1 flex items-center justify-between">
                  <span>💻 Simulation Terminal Output</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                {simLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">{log}</div>
                ))}
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Multiple-Choice Reflection Questions Section (1 Question Per Step) */}
      {scenario?.reflectionQuestions && scenario.reflectionQuestions.length > 0 && (() => {
        const questions = scenario.reflectionQuestions;
        const safeQIdx = Math.min(Math.max(0, currentQuestionIdx), questions.length - 1);
        const currentQ = questions[safeQIdx];
        const answeredCount = questions.filter(q => reflectionAnswers[q.id] !== undefined).length;
        const isAllAnswered = answeredCount === questions.length;
        const selectedOpt = currentQ ? reflectionAnswers[currentQ.id] : undefined;
        const thaiOptionLabels = ['ก.', 'ข.', 'ค.', 'ง.', 'จ.'];

        return (
          <div className="bg-white/90 backdrop-blur-xl border border-blue-100/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn">
            {/* Header & Stepper Navigator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xl shadow-md shadow-blue-500/20">
                  📝
                </div>
                <div>
                  <h4 className="font-extrabold text-base sm:text-lg text-slate-900">
                    ตอบคำถามสะท้อนคิดเชิงตรรกะ (ข้อที่ {safeQIdx + 1} จาก {questions.length} ข้อ)
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    คลิกเลือกคำตอบที่ถูกต้องและสมเหตุสมผลที่สุดในแต่ละข้อ (รูบริกเต็ม 35 คะแนน)
                  </p>
                </div>
              </div>

              {/* Question Stepper Pills */}
              <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 self-start sm:self-center">
                {questions.map((q, qIdx) => {
                  const isAnswered = reflectionAnswers[q.id] !== undefined;
                  const isCurrent = safeQIdx === qIdx;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => {
                        setCurrentQuestionIdx(qIdx);
                        playSound('click', soundEnabled);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center space-x-1 ${
                        isCurrent
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 scale-105'
                          : isAnswered
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                          : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                      title={`ข้อที่ ${qIdx + 1}`}
                    >
                      {isAnswered && !isCurrent ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : null}
                      <span>ข้อ {qIdx + 1}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Question Box (Single View) */}
            {currentQ && (
              <div className="space-y-4 animate-fadeIn" key={currentQ.id}>
                <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/40 border border-blue-200/80">
                  <div className="flex items-start space-x-3">
                    <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      {safeQIdx + 1}
                    </span>
                    <h5 className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
                      {currentQ.question}
                    </h5>
                  </div>
                </div>

                {/* Options List */}
                <div className="space-y-2.5">
                  {currentQ.options.map((opt, optIdx) => {
                    const isSelected = selectedOpt === optIdx;
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => {
                          handleSelectReflection(currentQ.id, optIdx);
                          playSound('click', soundEnabled);
                        }}
                        className={`w-full text-left p-4 rounded-2xl text-xs sm:text-sm transition-all duration-200 flex items-center justify-between border ${
                          isSelected
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-md shadow-blue-600/25 font-bold scale-[1.01]'
                            : 'bg-white hover:bg-blue-50/70 text-slate-700 border-slate-200 hover:border-blue-300 font-medium'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className={`w-6 h-6 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {thaiOptionLabels[optIdx] || `${optIdx + 1}.`}
                          </span>
                          <span className="leading-snug">{opt}</span>
                        </div>
                        {isSelected && <Check className="w-5 h-5 shrink-0 text-white ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom Stepper Navigation & Action Controls */}
            <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={safeQIdx === 0}
                  onClick={() => {
                    setCurrentQuestionIdx(prev => Math.max(0, prev - 1));
                    playSound('click', soundEnabled);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 text-slate-700 font-extrabold text-xs transition flex items-center space-x-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>ข้อก่อนหน้า</span>
                </button>

                {safeQIdx < questions.length - 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentQuestionIdx(prev => Math.min(questions.length - 1, prev + 1));
                      playSound('click', soundEnabled);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition flex items-center space-x-1.5 shadow-xs action-btn-hover"
                  >
                    <span>ข้อถัดไป</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Answered Counter Badge */}
              <div className="text-xs font-bold text-slate-500">
                ตอบแล้ว <span className={`font-black ${isAllAnswered ? 'text-emerald-600' : 'text-blue-600'}`}>{answeredCount}</span> / {questions.length} ข้อ
              </div>

              {/* Submit & Rubric Button */}
              <button
                type="button"
                onClick={handleEvaluateAndSubmit}
                className={`w-full sm:w-auto font-black px-7 py-3 rounded-2xl shadow-md transition-all duration-200 text-xs sm:text-sm flex items-center justify-center space-x-2 action-btn-hover ${
                  isAllAnswered
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-600/25'
                    : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-blue-600/25'
                }`}
              >
                <Award className="w-4 h-4 text-amber-300" />
                <span>ตรวจคำตอบ & ส่งประเมินผลรูบริก (Rubric)</span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* Rubric Evaluation Modal / Result Banner */}
      {rubricResult && (
        <div className="bg-gradient-to-br from-emerald-50 via-teal-50/60 to-sky-50 border-2 border-emerald-400/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-600/10 space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-200/80 pb-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-2xl shadow-md shadow-emerald-600/25">
                🏆
              </div>
              <div>
                <h4 className="text-lg font-black text-emerald-950">
                  ผลการประเมินรูบริก (Rubric Assessment Result)
                </h4>
                <p className="text-xs text-emerald-700 font-medium">สอดคล้องตามตัวชี้วัด ว 4.2 ป.6/1</p>
              </div>
            </div>

            <div className="text-right bg-white px-5 py-2.5 rounded-2xl border border-emerald-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">คะแนนภารกิจ Final</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-600">
                {rubricResult.finalScore} / {rubricResult.maxFinalScore}
              </span>
              <span className="text-xs font-bold text-slate-600 ml-1">คะแนน</span>
            </div>
          </div>

          {/* 5 Criteria Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
            {Object.keys(rubricResult).filter(k => rubricResult[k]?.name).map((key) => {
              const item = rubricResult[key];
              return (
                <div key={key} className="bg-white p-3.5 rounded-2xl border border-emerald-100/80 shadow-xs">
                  <div className="text-[11px] font-bold text-slate-700 mb-1.5">{item.name}</div>
                  <div className="flex items-center justify-between">
                    <div className="flex text-amber-400 text-xs">
                      {'⭐'.repeat(item.score)}
                    </div>
                    <span className="text-xs font-black text-emerald-700">{item.score}/{item.max}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold text-center shadow-sm">
            🎉 ยอดเยี่ยมมาก! คุณผ่านภารกิจ Final Mission แล้ว ระบบได้ปลดล็อกแบบทดสอบหลังเรียน (Post-Test) ให้เรียบร้อยครับ
          </div>
        </div>
      )}

    </div>
  );
};

export default FlowchartCanvas;
