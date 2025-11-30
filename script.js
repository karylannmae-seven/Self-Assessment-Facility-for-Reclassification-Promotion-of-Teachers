document.addEventListener('DOMContentLoaded', () => {

    // --- 1. CONFIGURATION DATABASE ---
    const requirements = {
        "Teacher II":         { coi_vs: 6,  coi_o: 0,  ncoi_vs: 4,  ncoi_o: 0 },
        "Teacher III":        { coi_vs: 12, coi_o: 0,  ncoi_vs: 8,  ncoi_o: 0 },
        "Teacher IV":         { coi_vs: 21, coi_o: 0,  ncoi_vs: 16, ncoi_o: 0 }, // Stage 2 Entry
        "Teacher V":          { coi_vs: 0,  coi_o: 6,  ncoi_vs: 0,  ncoi_o: 4 },
        "Teacher VI":         { coi_vs: 0,  coi_o: 12, ncoi_vs: 4,  ncoi_o: 4 },
        "Teacher VII":        { coi_vs: 0,  coi_o: 18, ncoi_vs: 6,  ncoi_o: 6 },
        "Master Teacher I":   { coi_vs: 0,  coi_o: 21, ncoi_vs: 8,  ncoi_o: 8 }, // Stage 3 Entry
        "Master Teacher II":  { coi_vs: 0,  coi_o: 10, ncoi_vs: 5,  ncoi_o: 5 },
        "Master Teacher III": { coi_vs: 0,  coi_o: 21, ncoi_vs: 8,  ncoi_o: 8 }, // Stage 4 Entry
        "Master Teacher IV":  { coi_vs: 0,  coi_o: 10, ncoi_vs: 5,  ncoi_o: 5 },
        "Master Teacher V":   { coi_vs: 0,  coi_o: 21, ncoi_vs: 8,  ncoi_o: 8 }
    };

    const positionDetails = {
        "Teacher I":        { sg: 11, stage: 1 },
        "Teacher II":       { sg: 12, stage: 1 },
        "Teacher III":      { sg: 13, stage: 1 },
        
        "Teacher IV":       { sg: 14, stage: 2 }, // Entry for Stage 2
        "Teacher V":        { sg: 15, stage: 2 },
        "Teacher VI":       { sg: 16, stage: 2 },
        "Teacher VII":      { sg: 17, stage: 2 },
        
        "Master Teacher I":   { sg: 18, stage: 3 }, // Entry for Stage 3
        "Master Teacher II":  { sg: 19, stage: 3 },
        
        "Master Teacher III": { sg: 20, stage: 4 }, // Entry for Stage 4
        "Master Teacher IV":  { sg: 21, stage: 4 },
        "Master Teacher V":   { sg: 22, stage: 4 }
    };

    // --- Elements ---
    const form = document.getElementById('assessment-form');
    const showResultBtn = document.getElementById('show-result-btn');
    const reloadBtn = document.getElementById('reload-btn');
    const resultContainer = document.getElementById('result-container');
    const currentPosSelect = document.getElementById('current-position');
    const appliedPosSelect = document.getElementById('applied-position');
    const remarksText = document.getElementById('remarks-text');
    
    // Result spans
    const resultCurrentPos = document.getElementById('result-current-pos');
    const resultAppliedPos = document.getElementById('result-applied-pos');
    const resultCoiO = document.getElementById('result-coi-o');
    const resultCoiVs = document.getElementById('result-coi-vs');
    const resultNcoiO = document.getElementById('result-ncoi-o');
    const resultNcoiVs = document.getElementById('result-ncoi-vs');
    const remarksPosition = document.getElementById('remarks-position');

    showResultBtn.addEventListener('click', calculateResults);
    reloadBtn.addEventListener('click', () => location.reload());

    // --- HELPER: Find the Entry Position for a Stage ---
    function getEntryPositionForStage(stageNum) {
        // Returns the position name with the lowest SG for the given stage
        const positionsInStage = Object.keys(positionDetails).filter(key => positionDetails[key].stage === stageNum);
        // Sort by SG ascending
        positionsInStage.sort((a, b) => positionDetails[a].sg - positionDetails[b].sg);
        return positionsInStage[0]; // The first one is the entry position
    }

    // --- HELPER: Validate Scores Against a Specific Position ---
    // This is extracted so we can reuse it for both Target Position and Entry Position checks
    function validateScores(positionName, userScores) {
        const rules = requirements[positionName];
        let errors = [];
        let surplusCoiO = 0;
        let surplusNcoiO = 0;

        if (!rules) return { passed: false, errors: ["No rules found for " + positionName] };

        // 1. Check Outstanding
        if (userScores.coiO >= rules.coi_o) {
            surplusCoiO = userScores.coiO - rules.coi_o;
        } else {
            errors.push(`- Lacking COI (Outstanding) for ${positionName}: Need ${rules.coi_o}, have ${userScores.coiO}.`);
        }

        if (userScores.ncoiO >= rules.ncoi_o) {
            surplusNcoiO = userScores.ncoiO - rules.ncoi_o;
        } else {
            errors.push(`- Lacking NCOI (Outstanding) for ${positionName}: Need ${rules.ncoi_o}, have ${userScores.ncoiO}.`);
        }

        // 2. Check Very Satisfactory (Using Surplus O)
        const totalEffectiveCoiVs = userScores.coiVs + surplusCoiO;
        if (totalEffectiveCoiVs < rules.coi_vs) {
            errors.push(`- Lacking COI (Very Sat) for ${positionName}: Need ${rules.coi_vs}, have ${totalEffectiveCoiVs} (incl. surplus).`);
        }

        const totalEffectiveNcoiVs = userScores.ncoiVs + surplusNcoiO;
        if (totalEffectiveNcoiVs < rules.ncoi_vs) {
            errors.push(`- Lacking NCOI (Very Sat) for ${positionName}: Need ${rules.ncoi_vs}, have ${totalEffectiveNcoiVs} (incl. surplus).`);
        }

        return { passed: errors.length === 0, errors: errors };
    }

    // --- CHECK ELIGIBILITY FUNCTION ---
    function checkEligibility(currentPosName, targetPosName, userScores) {
        const curDetails = positionDetails[currentPosName];
        const targetDetails = positionDetails[targetPosName];
        let messages = [];

        // 1. Basic Existence Checks
        if (!curDetails || !targetDetails) return { qualified: false, messages: ["Invalid position data."] };

        // 2. Regulatory Checks
        // Rule: Career Stage Jumping (Only current stage or +1 allowed)
        if (targetDetails.stage > curDetails.stage + 1) {
            return { qualified: false, messages: [`❌ <strong>Career Stage Violation:</strong> Cannot jump from Stage ${curDetails.stage} to Stage ${targetDetails.stage}.`] };
        }

        // Rule: 3 Salary Grade Limit
        const sgDiff = targetDetails.sg - curDetails.sg;
        if (sgDiff > 3) {
            return { qualified: false, messages: [`❌ <strong>Salary Grade Limitation:</strong> Gap is ${sgDiff} grades (Max 3 allowed).`] };
        }

        // Rule: No Demotion
        if (targetDetails.sg <= curDetails.sg) {
            return { qualified: false, messages: [`❌ <strong>Invalid Application:</strong> Target position must be a promotion.`] };
        }

        // 3. SCORE CHECK A: The Target Position
        // We check if they qualify for the specific job they applied for
        const targetCheck = validateScores(targetPosName, userScores);
        if (!targetCheck.passed) {
            messages.push(...targetCheck.errors);
            return { qualified: false, messages: messages };
        }

        // 4. SCORE CHECK B: The "Entry Position" Rule (NEW)
        // If moving to a NEW Stage, check if they are skipping the "Entry Position".
        // If they are, they must ALSO meet the requirements of the Entry Position.
        if (targetDetails.stage > curDetails.stage) {
            const entryPosName = getEntryPositionForStage(targetDetails.stage);
            
            // If the applied position is NOT the entry position (e.g., Applied for Teacher V, but Entry is Teacher IV)
            if (entryPosName && entryPosName !== targetPosName) {
                const entryCheck = validateScores(entryPosName, userScores);
                
                if (!entryCheck.passed) {
                    messages.push(`<br>⚠️ <strong>Stage Entry Rule Violation:</strong>`);
                    messages.push(`You are applying for <strong>${targetPosName}</strong> (Stage ${targetDetails.stage}).`);
                    messages.push(`Because you are skipping the entry position of this stage (<strong>${entryPosName}</strong>), you must meet its baseline requirements as well.`);
                    messages.push(...entryCheck.errors);
                    return { qualified: false, messages: messages };
                }
            }
        }

        return { qualified: true, messages: [] };
    }


    // --- MAIN EXECUTION ---
    function calculateResults() {
        // 1. Count Scores
        let userScores = { coiO: 0, coiVs: 0, ncoiO: 0, ncoiVs: 0 };
        const checkedRadios = form.querySelectorAll('input[type="radio"]:checked');

        checkedRadios.forEach(radio => {
            const type = radio.dataset.type;
            const value = radio.value;
            if (type === 'coi') {
                if (value === 'outstanding') userScores.coiO++;
                else if (value === 'verySatisfactory') userScores.coiVs++;
            } else if (type === 'ncoi') {
                if (value === 'outstanding') userScores.ncoiO++;
                else if (value === 'verySatisfactory') userScores.ncoiVs++;
            }
        });

        const curPosName = currentPosSelect.value;
        const appPosName = appliedPosSelect.value;

        if (!appPosName) {
            alert("Please select a target position.");
            return;
        }

        // 2. Perform Checks
        const result = checkEligibility(curPosName, appPosName, userScores);
        let finalHTML = "";
        let color = "";

        if (result.qualified) {
            finalHTML = "🎉 <strong>Qualified!</strong><br>You meet all requirements (including the Stage Entry baseline) for this position.";
            color = "var(--text-green)";
        } else {
            // Failed applied position
            finalHTML = `<strong>Not Qualified for ${appPosName}</strong>:<br><ul style="text-align:left; margin-top:5px; margin-bottom:15px;">` + 
                        result.messages.map(m => `<li>${m}</li>`).join('') + "</ul>";
            color = "#ffcccc";

            // Fallback Logic (Find highest eligible)
            const allPositions = Object.keys(positionDetails);
            allPositions.sort((a, b) => positionDetails[b].sg - positionDetails[a].sg);

            let suggestion = null;
            for (const candidatePos of allPositions) {
                const candidateDetails = positionDetails[candidatePos];
                const appliedDetails = positionDetails[appPosName];
                const currentDetails = positionDetails[curPosName];

                if (candidateDetails.sg >= appliedDetails.sg) continue; // Must be lower than target
                if (candidateDetails.sg <= currentDetails.sg) continue; // Must be promotion

                const fallbackCheck = checkEligibility(curPosName, candidatePos, userScores);
                if (fallbackCheck.qualified) {
                    suggestion = candidatePos;
                    break; 
                }
            }

            if (suggestion) {
                finalHTML += `<div style="background-color:rgba(255,255,255,0.1); padding:10px; border-radius:5px; margin-top:10px;">
                                💡 <strong>Suggestion:</strong><br>
                                Based on your scores, you are eligible for: 
                                <br><strong style="font-size:1.2rem; color: #bfffdd;">${suggestion}</strong>
                              </div>`;
            }
        }

        // 3. Display
        resultCurrentPos.textContent = curPosName;
        resultAppliedPos.textContent = appPosName;
        remarksPosition.textContent = appPosName;

        resultCoiO.textContent = userScores.coiO;
        resultCoiVs.textContent = userScores.coiVs;
        resultNcoiO.textContent = userScores.ncoiO;
        resultNcoiVs.textContent = userScores.ncoiVs;

        remarksText.innerHTML = finalHTML;
        remarksText.style.color = color;

        resultContainer.classList.remove('hidden');
        showResultBtn.style.display = 'none';
        resultContainer.scrollIntoView({ behavior: 'smooth' });
    }
});