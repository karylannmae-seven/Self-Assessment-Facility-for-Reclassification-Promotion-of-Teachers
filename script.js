// ===== TIME AND USER COUNTER =====
function initializeTime() {
    const timeElement = document.getElementById('current-time');
    
    function updateTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        timeElement.textContent = `${hours}:${minutes}:${seconds}`;
    }
    
    updateTime();
    setInterval(updateTime, 1000);
}

function initializeUserCounter() {
    const counterElement = document.getElementById('user-count');
    
    // Get or create user count from localStorage
    let userCount = localStorage.getItem('user-count');
    
    if (!userCount) {
        userCount = 1;
    } else {
        userCount = parseInt(userCount) + 1;
    }
    
    // Store the updated count
    localStorage.setItem('user-count', userCount);
    counterElement.textContent = userCount;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeTime();
    initializeUserCounter();
});

// ===== FORM STATE PRESERVATION =====
// Form state persistence has been disabled to prevent automatic saving of user inputs.

// ===== VALIDATION MODAL =====
function showValidationModal(errors) {
    const modal = document.getElementById('validation-modal');
    const errorList = document.getElementById('modal-errors');
    
    errorList.innerHTML = '';
    errors.forEach(error => {
        const li = document.createElement('li');
        li.textContent = error;
        errorList.appendChild(li);
    });
    
    modal.classList.remove('hidden');
}

function closeValidationModal() {
    const modal = document.getElementById('validation-modal');
    modal.classList.add('hidden');
}

// Info modal
document.addEventListener('DOMContentLoaded', () => {
    const infoBtn = document.getElementById('info-btn');
    const infoModal = document.getElementById('info-modal');
    const infoModalClose = document.getElementById('info-modal-close');
    const infoModalOk = document.getElementById('info-modal-ok');

    function closeInfoModal() {
        infoModal.classList.add('hidden');
    }

    if (infoModal) infoModal.classList.remove('hidden');

    if (infoBtn) infoBtn.addEventListener('click', () => infoModal.classList.remove('hidden'));
    if (infoModalClose) infoModalClose.addEventListener('click', closeInfoModal);
    if (infoModalOk) infoModalOk.addEventListener('click', closeInfoModal);
    infoModal?.addEventListener('click', (e) => { if (e.target.id === 'info-modal') closeInfoModal(); });
});

// Modal event listeners
document.addEventListener('DOMContentLoaded', () => {
    const modalCloseBtn = document.getElementById('modal-close');
    const modalOkBtn = document.getElementById('modal-ok-btn');
    
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeValidationModal);
    }
    if (modalOkBtn) {
        modalOkBtn.addEventListener('click', closeValidationModal);
    }
    
    // Close modal when clicking outside
    document.getElementById('validation-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'validation-modal') {
            closeValidationModal();
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {

    // === QUALIFICATION RULES ===
    // CROSS-STAGE MOVEMENT (e.g., Stage 1 applying for Stage 2):
    //   - Applicant must meet BOTH entry position requirements AND target position requirements
    //   - Example: Teacher II (Stage 1) applying for Teacher V (Stage 2)
    //     * Must qualify for Teacher IV (Stage 2 entry position)
    //     * AND must qualify for Teacher V (position applied for)
    //
    // SAME-STAGE MOVEMENT (e.g., Stage 2 applying for Stage 2):
    //   - Applicant must meet ONLY target position requirements
    //   - Example: Teacher IV applying for Teacher VII (both Stage 2)
    //     * Must qualify for Teacher VII only

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
    const form1 = document.getElementById('assessment-form');
    const form2 = document.getElementById('assessment-form-mt1');
    const form3 = document.getElementById('assessment-form-mt2');
    const allForms = [form1, form2, form3].filter(f => f !== null);
    
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
    const modifyBtn = document.getElementById('modify-btn');
    const printBtn  = document.getElementById('print-btn');
    
    // Requirements spans
    const reqCoiO = document.getElementById('req-coi-o');
    const reqCoiVs = document.getElementById('req-coi-vs');
    const reqNcoiO = document.getElementById('req-ncoi-o');
    const reqNcoiVs = document.getElementById('req-ncoi-vs');

    if (showResultBtn) {
        showResultBtn.addEventListener('click', calculateResults);
    } else {
        console.error('Button with ID "show-result-btn" not found!');
    }
    
    if (reloadBtn) {
        reloadBtn.addEventListener('click', () => {
            location.reload();
        });
    }

    // Modify Assessment button handler
    if (modifyBtn) {
        modifyBtn.addEventListener('click', () => {
            // Hide result container and action buttons
            resultContainer.classList.add('hidden');
            modifyBtn.classList.add('hidden');
            if (printBtn) printBtn.classList.add('hidden');
            
            // Show the generate report button again
            showResultBtn.classList.remove('hidden');
            showResultBtn.style.display = 'block';
            
            // Show the form section
            const currentPos = currentPosSelect.value;
            if (currentPos) {
                if (currentPos === 'Teacher I' || ['Teacher II','Teacher III','Teacher IV','Teacher V','Teacher VI','Teacher VII'].includes(currentPos)) {
                    document.getElementById('rftp-teacher').classList.remove('hidden');
                } else if (['Master Teacher I','Master Teacher II','Master Teacher III'].includes(currentPos)) {
                    document.getElementById('rftp-mt-i-iii').classList.remove('hidden');
                } else if (['Master Teacher IV','Master Teacher V'].includes(currentPos)) {
                    document.getElementById('rftp-mt-iv-v').classList.remove('hidden');
                }
            }
            
            // Scroll to form top
            window.scrollTo({ top: document.querySelector('.config-section').offsetTop - 100, behavior: 'smooth' });
        });
    }

    if (printBtn) {
        printBtn.addEventListener('click', () => {
            const logoSrc = (document.querySelector('.deped-logo') || {}).src || '';

            // Find the visible assessment section
            const activeSection = ['rftp-teacher', 'rftp-mt-i-iii', 'rftp-mt-iv-v']
                .map(id => document.getElementById(id))
                .find(el => el && !el.classList.contains('hidden'));

            // Build form table rows from the active assessment section
            let formRows = '';
            if (activeSection) {
                activeSection.querySelectorAll('.domain-header, .indicator-row').forEach(el => {
                    if (el.classList.contains('domain-header')) {
                        const text = el.querySelector('h3')?.textContent || '';
                        formRows += `<tr class="domain-row"><td colspan="5">${text}</td></tr>`;
                    } else {
                        const no   = el.querySelector('.no')?.textContent?.trim() || '';
                        const text = el.querySelector('.indicator-text')?.innerHTML || '';
                        let o = false, vs = false, dnm = false;
                        el.querySelectorAll('input[type="radio"]').forEach(r => {
                            if (r.checked) {
                                if (r.value === 'outstanding')     o   = true;
                                if (r.value === 'verySatisfactory') vs  = true;
                                if (r.value === 'didNotMeet')       dnm = true;
                            }
                        });
                        formRows += `<tr>
                            <td class="col-no">${no}</td>
                            <td class="col-text">${text}</td>
                            <td class="col-check">${o   ? '&#9679;' : '&#9675;'}</td>
                            <td class="col-check">${vs  ? '&#9679;' : '&#9675;'}</td>
                            <td class="col-check">${dnm ? '&#9679;' : '&#9675;'}</td>
                        </tr>`;
                    }
                });
            }

            // Collect result values from DOM
            const curPos     = document.getElementById('result-current-pos')?.textContent || '';
            const appPos     = document.getElementById('result-applied-pos')?.textContent || '';
            const reqCoiO    = document.getElementById('req-coi-o')?.textContent    || '0';
            const reqCoiVs   = document.getElementById('req-coi-vs')?.textContent   || '0';
            const reqNcoiO   = document.getElementById('req-ncoi-o')?.textContent   || '0';
            const reqNcoiVs  = document.getElementById('req-ncoi-vs')?.textContent  || '0';
            const resCoiO    = document.getElementById('result-coi-o')?.textContent  || '0';
            const resCoiVs   = document.getElementById('result-coi-vs')?.textContent || '0';
            const resNcoiO   = document.getElementById('result-ncoi-o')?.textContent || '0';
            const resNcoiVs  = document.getElementById('result-ncoi-vs')?.textContent|| '0';
            const remPos     = document.getElementById('remarks-position')?.textContent || '';
            const remHTML    = document.getElementById('remarks-text')?.innerHTML || '';
            const printDate  = new Date().toLocaleString('en-PH', { dateStyle: 'long', timeStyle: 'short' });

            const pw = window.open('', '_blank');
            pw.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>PPST Self-Assessment Report</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:Arial,sans-serif;font-size:11pt;color:#1a1a1a;background:#fff;padding:24px 32px;}

  .ph{text-align:center;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid #059669;}
  .ph img{height:64px;margin-bottom:6px;display:block;margin-left:auto;margin-right:auto;}
  .ph h2{font-size:13pt;margin:4px 0 2px;}
  .ph p{font-size:10pt;color:#555;}
  .ph .rpt{font-size:12pt;font-weight:700;margin-top:8px;color:#059669;}

  .meta{margin-bottom:16px;font-size:11pt;}
  .meta p{margin-bottom:4px;}

  h2.sh{font-size:11.5pt;color:#059669;margin:20px 0 8px;padding-bottom:4px;border-bottom:1px solid #d1fae5;}

  /* Assessment form table */
  .ft{width:100%;border-collapse:collapse;font-size:9pt;margin-bottom:4px;}
  .ft th{background:#f0fdf4;padding:6px 8px;border:1px solid #d1d5db;font-size:9pt;}
  .ft th.thl{text-align:left;}
  .ft td{padding:5px 8px;border:1px solid #e5e7eb;vertical-align:top;}
  .ft .col-no{text-align:center;width:30px;}
  .ft .col-check{text-align:center;width:78px;font-size:13pt;}
  .ft .col-check.hit{color:#059669;}
  .ft tr.domain-row td{background:#e0f2fe;font-weight:700;font-size:10pt;color:#0369a1;padding:6px 8px;}
  .ft .tag-coi{background:#dcfce7;color:#166534;font-size:8pt;padding:1px 5px;border-radius:3px;margin-left:4px;font-weight:600;}
  .ft .tag-ncoi{background:#dbeafe;color:#1e40af;font-size:8pt;padding:1px 5px;border-radius:3px;margin-left:4px;font-weight:600;}

  /* Summary cards */
  .cards{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;}
  .card{border:1px solid #d1d5db;border-left:4px solid #059669;padding:10px 14px;border-radius:4px;}
  .card-lbl{font-size:8.5pt;color:#6b7280;text-transform:uppercase;margin-bottom:4px;}
  .card-val{font-size:20pt;font-weight:700;color:#059669;}

  /* Remarks — force all text dark regardless of inline color styles copied from the main page */
  .rem-outer{border:1px solid #d1d5db;border-radius:6px;overflow:hidden;}
  .rem-head{display:grid;grid-template-columns:160px 1fr;background:#f3f4f6;border-bottom:2px solid #d1d5db;}
  .rem-body span, .rem-body span *{color:#1a1a1a !important;}
  .rem-head span,.rem-body span{padding:10px 14px;}
  .rem-head span{font-weight:700;font-size:10pt;}
  .rem-body{display:grid;grid-template-columns:160px 1fr;}
  .rem-body span:first-child{border-right:1px solid #d1d5db;font-weight:600;font-size:10.5pt;}

  /* Qual assessment card */
  .qual-assessment{background:#fff;font-size:10pt;color:#1a1a1a;padding:12px 14px;}
  .qa-title{font-weight:700;font-size:11pt;margin-bottom:10px;}
  .qa-table{width:100%;border-collapse:collapse;margin-bottom:12px;}
  .qa-table th{text-align:left;padding:7px 10px;font-size:9pt;font-weight:600;color:#555;border-bottom:1px solid #d1d5db;}
  .qa-table td{padding:9px 10px;border-bottom:1px solid #f0f0f0;color:#1a1a1a;}
  .qa-table td:last-child{white-space:nowrap;}
  .qa-overall{font-size:11pt;margin-bottom:6px;}
  .qa-reason{font-size:10pt;color:#444;}
  .qa-copy-btn{display:none;}

  .pf{text-align:center;font-size:9pt;color:#9ca3af;margin-top:24px;padding-top:8px;border-top:1px solid #e5e7eb;}

  @page{margin:1.5cm;}
</style>
</head>
<body>
<div class="ph">
  ${logoSrc ? `<img src="${logoSrc}" alt="School Seal">` : ''}
  <h2>Dapa Central Elementary School and SPED Center-SSES</h2>
  <p>Department of Education - Siargao Division</p>
  <div class="rpt">PPST Self-Assessment Report</div>
</div>

<div class="meta">
  <p><strong>Current Position:</strong> ${curPos}</p>
  <p><strong>Applied For:</strong> ${appPos}</p>
</div>

<h2 class="sh">Summary of the Achievement of PPST Indicators</h2>
<table class="ft">
  <thead>
    <tr>
      <th class="col-no">No.</th>
      <th class="thl">DOMAIN / STRAND / INDICATORS</th>
      <th>Outstanding</th>
      <th>Very Satisfactory</th>
      <th>Did Not Meet</th>
    </tr>
  </thead>
  <tbody>${formRows}</tbody>
</table>

<h2 class="sh">Performance Requirements for the Position Applied For</h2>
<div class="cards">
  <div class="card"><div class="card-lbl">COI (Outstanding)</div><div class="card-val">${reqCoiO}</div></div>
  <div class="card"><div class="card-lbl">COI (Very Satisfactory)</div><div class="card-val">${reqCoiVs}</div></div>
  <div class="card"><div class="card-lbl">NCOI (Outstanding)</div><div class="card-val">${reqNcoiO}</div></div>
  <div class="card"><div class="card-lbl">NCOI (Very Satisfactory)</div><div class="card-val">${reqNcoiVs}</div></div>
</div>

<h2 class="sh">Assessment Results based on Applicant Indicators Achieved</h2>
<div class="cards">
  <div class="card"><div class="card-lbl">COI (Outstanding)</div><div class="card-val">${resCoiO}</div></div>
  <div class="card"><div class="card-lbl">COI (Very Satisfactory)</div><div class="card-val">${resCoiVs}</div></div>
  <div class="card"><div class="card-lbl">NCOI (Outstanding)</div><div class="card-val">${resNcoiO}</div></div>
  <div class="card"><div class="card-lbl">NCOI (Very Satisfactory)</div><div class="card-val">${resNcoiVs}</div></div>
</div>

<h2 class="sh">Assessment Report</h2>
<div class="rem-outer">
  <div class="rem-head"><span>Position Applied</span><span>Remarks</span></div>
  <div class="rem-body"><span>${remPos}</span><span>${remHTML}</span></div>
</div>

<div class="pf">Printed on: ${printDate}</div>
</body>
</html>`);
            pw.document.close();
            pw.focus();
            setTimeout(() => { pw.print(); pw.close(); }, 600);
        });
    }

    // Form auto-save functionality has been disabled

    // --- HELPER: Find the Entry Position for a Stage ---
    function getEntryPositionForStage(stageNum) {
        // Returns the position name with the lowest SG for the given stage
        const positionsInStage = Object.keys(positionDetails).filter(key => positionDetails[key].stage === stageNum);
        // Sort by SG ascending
        positionsInStage.sort((a, b) => positionDetails[a].sg - positionDetails[b].sg);
        return positionsInStage[0]; // The first one is the entry position
    }

    // --- CHECK ELIGIBILITY FUNCTION ---
    function checkEligibility(currentPosName, targetPosName, userScores) {
        const curDetails = positionDetails[currentPosName];
        const targetDetails = positionDetails[targetPosName];
        let messages = [];

        // 1. Basic Existence Checks
        if (!curDetails || !targetDetails) return { qualified: false, type: 'regulatory', messages: ["Invalid position data."] };

        // 2. Regulatory Checks
        // Rule: Career Stage Jumping (Only current stage or +1 allowed)
        if (targetDetails.stage > curDetails.stage + 1) {
            return { qualified: false, type: 'regulatory', messages: [`❌ <strong>Career Stage Violation:</strong> Cannot jump from Stage ${curDetails.stage} to Stage ${targetDetails.stage}. Under no circumstance shall an applicant be allowed to jump to a higher career stage for promotion without progressing through each of the career stages defined under the established professional standards.For example, an incumbent of any position under Career Stage I – Beginning Towards Proficient (Teacher I–III) must progress through positions under Career Stage II – Proficient (Teacher IV–VII) before advancing to any position under Career Stage III – Highly Proficient (Master Teacher I–II).`] };
        }

        // Rule: 3 Salary Grade Limit
        const sgDiff = targetDetails.sg - curDetails.sg;
        if (sgDiff > 3) {
            return { qualified: false, type: 'regulatory', messages: [`❌ <strong>Salary Grade Limitation:</strong> Gap is ${sgDiff} grades (Max 3 allowed). Promotion, whether through reclassification or natural vacancy, shall not exceed three (3) salary grades higher than the applicant's current position.`] };
        }

        // Rule: No Demotion
        if (targetDetails.sg <= curDetails.sg) {
            return { qualified: false, type: 'regulatory', messages: [`❌ <strong>Invalid Application:</strong> Target position must be a promotion.`] };
        }

        // 3. CROSS-STAGE vs SAME-STAGE CHECK
        // Determine if this is a cross-stage or same-stage movement
        const isCrossStage = targetDetails.stage > curDetails.stage;
        let entryPosName = null;
        let targetReqs = requirements[targetPosName];
        let entryReqs = null;
        
        if (isCrossStage) {
            entryPosName = getEntryPositionForStage(targetDetails.stage);
            // If the applied position is NOT the entry position (e.g., applying for Teacher V, but entry is Teacher IV)
            if (entryPosName && entryPosName !== targetPosName) {
                entryReqs = requirements[entryPosName];
            }
        }

        // 4. VALIDATE TARGET POSITION REQUIREMENTS
        // For the applied position, check if user meets required Outstanding and Very Satisfactory indicators
        targetReqs = requirements[targetPosName];
        const requiredCoiO = targetReqs.coi_o || 0;
        const requiredCoiVs = targetReqs.coi_vs || 0;
        const requiredNcoiO = targetReqs.ncoi_o || 0;
        const requiredNcoiVs = targetReqs.ncoi_vs || 0;
        
        // PERFORMANCE RATING HIERARCHY: Outstanding > Very Satisfactory
        // Outstanding indicators automatically satisfy Very Satisfactory requirements
        // Validate Outstanding first, then check Very Satisfactory with surplus Outstanding applied
        
        const enoughOutstandingCoi = userScores.coiO >= requiredCoiO;
        const enoughOutstandingNcoi = userScores.ncoiO >= requiredNcoiO;
        
        // Calculate surplus Outstanding that can count toward Very Satisfactory requirement
        // Example: If need 6 COI Outstanding and user has 10, surplus is 4 which can help with VS
        const surplusCoiO = Math.max(0, userScores.coiO - requiredCoiO);
        const surplusNcoiO = Math.max(0, userScores.ncoiO - requiredNcoiO);
        
        // Apply surplus Outstanding to Very Satisfactory requirement
        const totalEffectiveCoiVs = userScores.coiVs + surplusCoiO;
        const totalEffectiveNcoiVs = userScores.ncoiVs + surplusNcoiO;
        
        const enoughCoiVs = totalEffectiveCoiVs >= requiredCoiVs;
        const enoughNcoiVs = totalEffectiveNcoiVs >= requiredNcoiVs;
        
        // TARGET POSITION PASSED if all requirements satisfied
        const targetPassed = enoughOutstandingCoi && enoughOutstandingNcoi && enoughCoiVs && enoughNcoiVs;
        
        // For ENTRY POSITION (cross-stage only): Validate against 37-indicator PPST framework
        // PPST VALIDATION RULE: For career-stage advancement, applicant must satisfy BOTH:
        //   1) Requirements of the position applied for, AND
        //   2) Requirements of the ENTRY position of the target career stage
        //
        // INDICATOR CREDIT RULE: Higher-level performance ratings automatically satisfy 
        // lower-level requirements. Outstanding indicators used to satisfy the applied 
        // position's requirements ALSO count toward the entry position's 37-indicator total.
        // No double-counting beyond the total of 37 PPST indicators.
        //
        // CALCULATION LOGIC:
        // - Entry position requires a total of 37 indicators (Outstanding + Very Satisfactory)
        // - Applied position requires some Outstanding indicators
        // - These Outstanding from applied position count toward the 37 entry-position total
        // - Remaining indicators needed from entry position = entry_vs_required - applied_o_required
        
        let enoughVsCoiForEntry = true;
        let enoughVsNcoiForEntry = true;
        let enoughEntryOutstandingCoi = true;
        let enoughEntryOutstandingNcoi = true;
        let remainingCoiNeeded = 0;
        let remainingNcoiNeeded = 0;
        let entryOutstandingCoiNeeded = 0;
        let entryOutstandingNcoiNeeded = 0;
        
        if (isCrossStage && entryReqs) {
            // STEP 1: Check Outstanding requirements from entry position
            // Some entry positions (e.g., Master Teacher I, III) have Outstanding requirements
            entryOutstandingCoiNeeded = entryReqs.coi_o || 0;
            entryOutstandingNcoiNeeded = entryReqs.ncoi_o || 0;
            
            enoughEntryOutstandingCoi = userScores.coiO >= entryOutstandingCoiNeeded;
            enoughEntryOutstandingNcoi = userScores.ncoiO >= entryOutstandingNcoiNeeded;
            
            // STEP 2: Credit ALL Outstanding as Very Satisfactory for entry position purposes
            // Per PPST framework: "All Outstanding PPST indicators shall be credited as Very 
            // Satisfactory for purposes of satisfying entry-position and career-stage 
            // advancement requirements."
            // This means Outstanding indicators can fill the Very Satisfactory requirement slots
            // by being treated equivalently to Very Satisfactory ratings.
            const entryVsCoiNeeded = entryReqs.coi_vs || 0;
            const entryVsNcoiNeeded = entryReqs.ncoi_vs || 0;
            
            // Calculate total effective Very Satisfactory: actual VS + all Outstanding
            // Outstanding indicators count toward VS requirements for entry position
            // Example: User has 10 COI Outstanding + 15 COI Very Satisfactory
            // Entry position needs 21 COI at VS level = 10 + 15 = 25 (satisfies requirement)
            const totalEffectiveVsCoiForEntry = userScores.coiVs + userScores.coiO;
            const totalEffectiveVsNcoiForEntry = userScores.ncoiVs + userScores.ncoiO;
            
            remainingCoiNeeded = entryVsCoiNeeded;
            remainingNcoiNeeded = entryVsNcoiNeeded;
            
            // STEP 3: Verify user has enough total (Outstanding + Very Satisfactory) indicators
            // to satisfy entry position's Very Satisfactory requirement
            enoughVsCoiForEntry = totalEffectiveVsCoiForEntry >= remainingCoiNeeded;
            enoughVsNcoiForEntry = totalEffectiveVsNcoiForEntry >= remainingNcoiNeeded;
        }
        
        // ENTRY POSITION PASSED if all requirements are met
        const entryPassed = !entryReqs || (enoughEntryOutstandingCoi && enoughEntryOutstandingNcoi && enoughVsCoiForEntry && enoughVsNcoiForEntry);
        
        if (!targetPassed || !entryPassed) {
            // Show detailed failure message
            if (isCrossStage && entryReqs) {
                messages.push(`<br>⚠️ <strong>Career Stage Advancement Requirements:</strong>`);
                messages.push(`You are in Career Stage ${curDetails.stage} and applying for <strong>${targetPosName}</strong> in Career Stage ${targetDetails.stage}.`);
                messages.push(`<br><strong>For career stage advancement, you must satisfy BOTH sets below (37 total PPST indicators):</strong>`);
                
                // --- Updated Set 1: Target Position Detailed Validation ---
messages.push(`<br><strong style="color: #bfffdd;">Set 1 - What you need for the Target Position (${targetPosName}):</strong>`);

// 1. Validate Target Outstanding (O) Requirements
if (requiredCoiO > 0 || requiredNcoiO > 0) {
    messages.push(`<em>Outstanding Requirements:</em>`);
    if (!enoughOutstandingCoi) {
        messages.push(`❌ COI (O): Need ${requiredCoiO}, have ${userScores.coiO}`);
    } else if (requiredCoiO > 0) {
        messages.push(`✅ COI (O): Met (${userScores.coiO}/${requiredCoiO})`);
    }

    if (!enoughOutstandingNcoi) {
        messages.push(`❌ NCOI (O): Need ${requiredNcoiO}, have ${userScores.ncoiO}`);
    } else if (requiredNcoiO > 0) {
        messages.push(`✅ NCOI (O): Met (${userScores.ncoiO}/${requiredNcoiO})`);
    }
}

// 2. Validate Target Very Satisfactory (VS) Requirements
// Note: totalEffectiveCoiVs and totalEffectiveNcoiVs already include surplus 'Outstanding' indicators.
if (requiredCoiVs > 0 || requiredNcoiVs > 0) {
    messages.push(`<em>Very Satisfactory Requirements:</em>`);
    if (!enoughCoiVs) {
        messages.push(`❌ COI (VS): Need ${requiredCoiVs}, have ${totalEffectiveCoiVs}`);
    } else if (requiredCoiVs > 0) {
        messages.push(`✅ COI (VS): Met (${totalEffectiveCoiVs}/${requiredCoiVs})`);
    }

    if (!enoughNcoiVs) {
        messages.push(`❌ NCOI (VS): Need ${requiredNcoiVs}, have ${totalEffectiveNcoiVs}`);
    } else if (requiredNcoiVs > 0) {
        messages.push(`✅ NCOI (VS): Met (${totalEffectiveNcoiVs}/${requiredNcoiVs})`);
    }
}
                
                // Set 2: Entry Position Outstanding Requirements + Very Satisfactory (with Outstanding credited)
                messages.push(`<br><strong style="color: #bfffdd;">Set 2 - What you additionally need for the Entry Position (${entryPosName}) — 37 Indicators Total:</strong>`);
                
                if (entryOutstandingCoiNeeded > 0 || entryOutstandingNcoiNeeded > 0) {
                    messages.push(`Outstanding: ${entryOutstandingCoiNeeded} COI + ${entryOutstandingNcoiNeeded} NCOI = ${entryOutstandingCoiNeeded + entryOutstandingNcoiNeeded} indicators`);
                    
                    if (!enoughEntryOutstandingCoi) {
                        messages.push(`❌ COI (Outstanding): Need ${entryOutstandingCoiNeeded}, have ${userScores.coiO}`);
                    }
                    if (!enoughEntryOutstandingNcoi) {
                        messages.push(`❌ NCOI (Outstanding): Need ${entryOutstandingNcoiNeeded}, have ${userScores.ncoiO}`);
                    }
                }
                
                if (remainingCoiNeeded > 0 || remainingNcoiNeeded > 0) {
                    messages.push(`Very Satisfactory (with Outstanding credited as VS): ${remainingCoiNeeded} COI + ${remainingNcoiNeeded} NCOI = ${remainingCoiNeeded + remainingNcoiNeeded} indicators`);
                    
                    if (!enoughVsCoiForEntry) {
                        messages.push(`❌ COI (VS or Outstanding): Need ${remainingCoiNeeded}, have ${userScores.coiVs + userScores.coiO} total (${userScores.coiVs} VS + ${userScores.coiO} O)`);
                    }
                    if (!enoughVsNcoiForEntry) {
                        messages.push(`❌ NCOI (VS or Outstanding): Need ${remainingNcoiNeeded}, have ${userScores.ncoiVs + userScores.ncoiO} total (${userScores.ncoiVs} VS + ${userScores.ncoiO} O)`);
                    }
                } else if (!entryPassed) {
                    messages.push(`❌ You do not meet the entry position requirements`);
                } else {
                    messages.push(`✅ You have met the entry position requirements`);
                }
                
                // Total is always 37 (entry position total). Entry position subsumes target when it requires more.
                const totalNeeded = entryOutstandingCoiNeeded + (entryReqs.coi_vs || 0) + entryOutstandingNcoiNeeded + remainingNcoiNeeded;
                messages.push(`<strong>Total PPST indicators needed: ${totalNeeded} / 37</strong>`);
                messages.push(`<em style="color:#ffe08a;">💡 Note: Meeting the Entry Position (${entryPosName}) requirements of ${totalNeeded} indicators automatically satisfies the Target Position (${targetPosName}) requirements.</em>`);
            } else {
                // Same-stage movement - show target position errors
                messages.push(`<br><strong>Requirements for ${targetPosName}:</strong>`);
                
                if (requiredCoiO > 0) {
                    if (!enoughOutstandingCoi) {
                        messages.push(`❌ COI (Outstanding): Need ${requiredCoiO}, have ${userScores.coiO}`);
                    } else {
                        messages.push(`✅ COI (Outstanding): Need ${requiredCoiO}, have ${userScores.coiO}`);
                    }
                }
                
                if (requiredNcoiO > 0) {
                    if (!enoughOutstandingNcoi) {
                        messages.push(`❌ NCOI (Outstanding): Need ${requiredNcoiO}, have ${userScores.ncoiO}`);
                    } else {
                        messages.push(`✅ NCOI (Outstanding): Need ${requiredNcoiO}, have ${userScores.ncoiO}`);
                    }
                }
                
                if (requiredCoiVs > 0) {
                    if (!enoughCoiVs) {
                        messages.push(`❌ COI (Very Satisfactory): Need ${requiredCoiVs}, have ${totalEffectiveCoiVs}`);
                    } else {
                        messages.push(`✅ COI (Very Satisfactory): Need ${requiredCoiVs}, have ${totalEffectiveCoiVs}`);
                    }
                }
                
                if (requiredNcoiVs > 0) {
                    if (!enoughNcoiVs) {
                        messages.push(`❌ NCOI (Very Satisfactory): Need ${requiredNcoiVs}, have ${totalEffectiveNcoiVs}`);
                    } else {
                        messages.push(`✅ NCOI (Very Satisfactory): Need ${requiredNcoiVs}, have ${totalEffectiveNcoiVs}`);
                    }
                }
            }
            
            if (isCrossStage && entryReqs) {
                return {
                    qualified: false,
                    type: 'requirements_cross',
                    messages,
                    crossData: {
                        targetPos: targetPosName,
                        entryPos: entryPosName,
                        target: {
                            reqCoiO: requiredCoiO, reqNcoiO: requiredNcoiO,
                            reqCoiVs: requiredCoiVs, reqNcoiVs: requiredNcoiVs,
                            userCoiO: userScores.coiO, userNcoiO: userScores.ncoiO,
                            userEffCoiVs: totalEffectiveCoiVs, userEffNcoiVs: totalEffectiveNcoiVs,
                            metCoiO: enoughOutstandingCoi, metNcoiO: enoughOutstandingNcoi,
                            metCoiVs: enoughCoiVs, metNcoiVs: enoughNcoiVs,
                            passed: targetPassed
                        },
                        entry: {
                            reqCoiO: entryOutstandingCoiNeeded, reqNcoiO: entryOutstandingNcoiNeeded,
                            reqCoiVs: remainingCoiNeeded, reqNcoiVs: remainingNcoiNeeded,
                            userCoiO: userScores.coiO, userNcoiO: userScores.ncoiO,
                            userEffCoiVs: userScores.coiVs + userScores.coiO,
                            userEffNcoiVs: userScores.ncoiVs + userScores.ncoiO,
                            metCoiO: enoughEntryOutstandingCoi, metNcoiO: enoughEntryOutstandingNcoi,
                            metCoiVs: enoughVsCoiForEntry, metNcoiVs: enoughVsNcoiForEntry,
                            passed: entryPassed
                        }
                    }
                };
            }
            return { qualified: false, type: 'requirements_same', messages };
        }

        return { qualified: true, type: 'qualified', messages: [] };
    }


    // --- QUALIFICATION TABLE HELPERS ---
    function buildQualRow(label, required, have, met) {
        const icon = met
            ? '<span style="color:#22c55e;">&#10003;</span> Met'
            : '<span style="color:#ef4444;">&#10007;</span> Not Met';
        return `<tr class="qa-row ${met ? 'qa-row-met' : 'qa-row-not-met'}">
            <td>${label}</td>
            <td>${required}</td>
            <td>${have}</td>
            <td style="white-space:nowrap">${icon}</td>
        </tr>`;
    }

    function buildQualTable(posName, scores, reqs, isQualified) {
        const reqCoiO  = reqs.coi_o  || 0;
        const reqCoiVs = reqs.coi_vs || 0;
        const reqNcoiO = reqs.ncoi_o  || 0;
        const reqNcoiVs = reqs.ncoi_vs || 0;

        const enoughCoiO  = scores.coiO  >= reqCoiO;
        const enoughNcoiO = scores.ncoiO >= reqNcoiO;
        const surplusCoiO  = Math.max(0, scores.coiO  - reqCoiO);
        const surplusNcoiO = Math.max(0, scores.ncoiO - reqNcoiO);
        const effectiveCoiVs  = scores.coiVs  + surplusCoiO;
        const effectiveNcoiVs = scores.ncoiVs + surplusNcoiO;
        const enoughCoiVs  = effectiveCoiVs  >= reqCoiVs;
        const enoughNcoiVs = effectiveNcoiVs >= reqNcoiVs;

        let rows = '';
        if (reqCoiO  > 0) rows += buildQualRow('COIs – Outstanding (O)',         reqCoiO,  scores.coiO,  enoughCoiO);
        if (reqNcoiO > 0) rows += buildQualRow('NCOIs – Outstanding (O)',        reqNcoiO, scores.ncoiO, enoughNcoiO);
        if (reqCoiVs  > 0) rows += buildQualRow('COIs – Very Satisfactory (VS)',  reqCoiVs,  effectiveCoiVs,  enoughCoiVs);
        if (reqNcoiVs > 0) rows += buildQualRow('NCOIs – Very Satisfactory (VS)', reqNcoiVs, effectiveNcoiVs, enoughNcoiVs);

        const notMet = [];
        if (reqCoiO  > 0 && !enoughCoiO)  notMet.push('COIs at Outstanding');
        if (reqNcoiO > 0 && !enoughNcoiO) notMet.push('NCOIs at Outstanding');
        if (reqCoiVs  > 0 && !enoughCoiVs)  notMet.push('COIs at Very Satisfactory');
        if (reqNcoiVs > 0 && !enoughNcoiVs) notMet.push('NCOIs at Very Satisfactory');

        const overallIcon = isQualified
            ? '<span style="color:#22c55e;">&#10003;</span>'
            : '<span style="color:#ef4444;">&#10007;</span>';
        const overallResultText = isQualified ? `Qualified for ${posName}` : `Not Qualified for ${posName}`;
        const overallResultColor = isQualified ? '#22c55e' : '#ef4444';
        const reasonText = notMet.length > 0
            ? `The required number of <strong style="color:#1a1a1a;">${notMet.join(' and ')}</strong> has not yet been met.`
            : '';

        return `<div class="qual-assessment">
            <div class="qa-title">${posName} — Qualification Assessment</div>
            <table class="qa-table">
                <thead>
                    <tr>
                        <th>Requirement</th>
                        <th>Required</th>
                        <th>Your Record</th>
                        <th>Status <button class="qa-copy-btn" title="Copy table" onclick="copyQualTable(this)">&#10697;</button></th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
            <div class="qa-overall">${overallIcon} <strong style="color:${overallResultColor};">${overallResultText}</strong></div>
            ${reasonText ? `<div class="qa-reason" style="color:#1a1a1a;"><strong style="color:#1a1a1a;">Reason:</strong> ${reasonText}</div>` : ''}
        </div>`;
    }

    function buildCrossStageQualTable(posName, cd) {
        const { targetPos, entryPos, target, entry } = cd;

        // Set 1 — target position rows
        let set1Rows = '';
        if (target.reqCoiO  > 0) set1Rows += buildQualRow('COIs – Outstanding (O)',         target.reqCoiO,  target.userCoiO,      target.metCoiO);
        if (target.reqNcoiO > 0) set1Rows += buildQualRow('NCOIs – Outstanding (O)',        target.reqNcoiO, target.userNcoiO,     target.metNcoiO);
        if (target.reqCoiVs  > 0) set1Rows += buildQualRow('COIs – Very Satisfactory (VS)',  target.reqCoiVs, target.userEffCoiVs,  target.metCoiVs);
        if (target.reqNcoiVs > 0) set1Rows += buildQualRow('NCOIs – Very Satisfactory (VS)', target.reqNcoiVs,target.userEffNcoiVs, target.metNcoiVs);
        if (!set1Rows) set1Rows = `<tr><td colspan="4" style="color:#888;font-style:italic;padding:10px 12px;">No specific requirements for this position.</td></tr>`;

        // Set 2 — entry position rows
        let set2Rows = '';
        if (entry.reqCoiO  > 0) set2Rows += buildQualRow('COIs – Outstanding (O)',                   entry.reqCoiO,  entry.userCoiO,      entry.metCoiO);
        if (entry.reqNcoiO > 0) set2Rows += buildQualRow('NCOIs – Outstanding (O)',                  entry.reqNcoiO, entry.userNcoiO,     entry.metNcoiO);
        if (entry.reqCoiVs  > 0) set2Rows += buildQualRow('COIs – Outstanding + VS (O+VS combined)',  entry.reqCoiVs, entry.userEffCoiVs,  entry.metCoiVs);
        if (entry.reqNcoiVs > 0) set2Rows += buildQualRow('NCOIs – Outstanding + VS (O+VS combined)', entry.reqNcoiVs,entry.userEffNcoiVs, entry.metNcoiVs);

        // Overall result
        const allPassed = target.passed && entry.passed;
        const overallIcon  = allPassed ? '<span style="color:#22c55e;">&#10003;</span>' : '<span style="color:#ef4444;">&#10007;</span>';
        const overallText  = allPassed ? `Qualified for ${posName}` : `Not Qualified for ${posName}`;
        const overallColor = allPassed ? '#22c55e' : '#ef4444';

        // Reason
        const notMet = [];
        if (target.reqCoiO  > 0 && !target.metCoiO)  notMet.push('COIs at Outstanding');
        if (target.reqNcoiO > 0 && !target.metNcoiO) notMet.push('NCOIs at Outstanding');
        if (target.reqCoiVs  > 0 && !target.metCoiVs)  notMet.push('COIs at Very Satisfactory');
        if (target.reqNcoiVs > 0 && !target.metNcoiVs) notMet.push('NCOIs at Very Satisfactory');
        if (entry.reqCoiO  > 0 && !entry.metCoiO)  notMet.push(`COIs at Outstanding (required by Entry Position)`);
        if (entry.reqNcoiO > 0 && !entry.metNcoiO) notMet.push(`NCOIs at Outstanding (required by Entry Position)`);
        if (entry.reqCoiVs  > 0 && !entry.metCoiVs)  notMet.push('COIs at VS for Entry Position');
        if (entry.reqNcoiVs > 0 && !entry.metNcoiVs) notMet.push('NCOIs at VS for Entry Position');

        const reasonText = notMet.length > 0
            ? `The required number of <strong style="color:#1a1a1a;">${[...new Set(notMet)].join(', ')}</strong> has not yet been met.`
            : '';

        const tableHeader = `<thead><tr>
            <th>Requirement</th><th>Required</th><th>Your Record</th>
            <th>Status <button class="qa-copy-btn" title="Copy table" onclick="copyQualTable(this)">&#10697;</button></th>
        </tr></thead>`;

        return `<div class="qual-assessment">
            <div class="qa-title">${posName} — Career Stage Advancement Assessment</div>
            <div class="qa-stage-note">
                Applying for <strong style="color:#374151;">${targetPos}</strong> requires satisfying
                <strong style="color:#374151;">BOTH</strong> sets of requirements below for career stage
                advancement (37 total PPST indicators).
            </div>

            <div class="qa-set-label">Set 1 &mdash; Target Position Requirements <span class="qa-set-pos">${targetPos}</span></div>
            <table class="qa-table">${tableHeader}<tbody>${set1Rows}</tbody></table>

            <div class="qa-set-label">
                Set 2 &mdash; Entry Position Requirements
                <span class="qa-set-pos">${entryPos}</span>
                <span class="qa-set-badge">37 Indicators Total</span>
            </div>
            <div class="qa-entry-note">Outstanding indicators are credited as Very Satisfactory for entry position purposes.</div>
            <table class="qa-table">${tableHeader}<tbody>${set2Rows}</tbody></table>

            <div class="qa-overall">${overallIcon} <strong style="color:${overallColor};">${overallText}</strong></div>
            ${reasonText ? `<div class="qa-reason" style="color:#1a1a1a;"><strong style="color:#1a1a1a;">Reason:</strong> ${reasonText}</div>` : ''}
        </div>`;
    }

    window.copyQualTable = function copyQualTable(btn) {
        const table = btn.closest('table');
        if (!table) return;
        const rows = [...table.querySelectorAll('tr')];
        const text = rows.map(r =>
            [...r.querySelectorAll('th,td')].map(c => c.innerText.replace(/\s+/g, ' ').trim()).join('\t')
        ).join('\n');
        navigator.clipboard.writeText(text).then(() => {
            btn.textContent = '✓';
            setTimeout(() => { btn.innerHTML = '&#10697;'; }, 1500);
        });
    }

    // --- MAIN EXECUTION ---
    function calculateResults() {
        // Validate form before processing
        const errors = [];
        
        if (!currentPosSelect.value) {
            errors.push('❌ Select your current position');
        }
        if (!appliedPosSelect.value) {
            errors.push('❌ Select your target position');
        }
        
        // Get the correct form based on applied position
        const appliedPos = appliedPosSelect.value;
        let currentForm = null;
        
        const teacherGroup = ['Teacher I', 'Teacher II','Teacher III','Teacher IV','Teacher V','Teacher VI','Teacher VII'];
        const mtGroup1 = ['Master Teacher I','Master Teacher II','Master Teacher III'];
        const mtGroup2 = ['Master Teacher IV','Master Teacher V'];
        
        if (teacherGroup.includes(appliedPos)) {
            currentForm = document.getElementById('assessment-form');
        } else if (mtGroup1.includes(appliedPos)) {
            currentForm = document.getElementById('assessment-form-mt1');
        } else if (mtGroup2.includes(appliedPos)) {
            currentForm = document.getElementById('assessment-form-mt2');
        }
        
        if (!currentForm) {
            errors.push('❌ Invalid position selected');
        } else {
            const checkedRadios = currentForm.querySelectorAll('input[type="radio"]:checked');
            
            if (checkedRadios.length === 0) {
                errors.push('❌ Answer all assessment questions (at least one response needed)');
            }
        }
        
        if (errors.length > 0) {
            showValidationModal(errors);
            return;
        }

        // 1. Count Scores
        let userScores = { coiO: 0, coiVs: 0, ncoiO: 0, ncoiVs: 0 };

        const checkedRadios = currentForm.querySelectorAll('input[type="radio"]:checked');
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
        const curDetails = positionDetails[curPosName];
        const targetDetails = positionDetails[appPosName];
        let finalHTML = "";
        let color = "";
        let usesTableDisplay = false;

        if (result.qualified) {
            if (targetDetails.stage > curDetails.stage) {
                const entryPos = getEntryPositionForStage(targetDetails.stage);
                if (entryPos && entryPos !== appPosName) {
                    // Build crossData for the qualified case — all checks are true
                    const tReqs = requirements[appPosName];
                    const eReqs = requirements[entryPos];
                    const reqCoiO  = tReqs.coi_o  || 0;
                    const reqNcoiO = tReqs.ncoi_o  || 0;
                    const surplusCoiO  = Math.max(0, userScores.coiO  - reqCoiO);
                    const surplusNcoiO = Math.max(0, userScores.ncoiO - reqNcoiO);
                    const qualCrossData = {
                        targetPos: appPosName, entryPos,
                        target: {
                            reqCoiO, reqNcoiO,
                            reqCoiVs: tReqs.coi_vs  || 0,
                            reqNcoiVs: tReqs.ncoi_vs || 0,
                            userCoiO: userScores.coiO, userNcoiO: userScores.ncoiO,
                            userEffCoiVs:  userScores.coiVs  + surplusCoiO,
                            userEffNcoiVs: userScores.ncoiVs + surplusNcoiO,
                            metCoiO: true, metNcoiO: true, metCoiVs: true, metNcoiVs: true, passed: true
                        },
                        entry: {
                            reqCoiO:  eReqs.coi_o  || 0, reqNcoiO: eReqs.ncoi_o  || 0,
                            reqCoiVs: eReqs.coi_vs || 0, reqNcoiVs: eReqs.ncoi_vs || 0,
                            userCoiO: userScores.coiO, userNcoiO: userScores.ncoiO,
                            userEffCoiVs:  userScores.coiVs  + userScores.coiO,
                            userEffNcoiVs: userScores.ncoiVs + userScores.ncoiO,
                            metCoiO: true, metNcoiO: true, metCoiVs: true, metNcoiVs: true, passed: true
                        }
                    };
                    finalHTML = buildCrossStageQualTable(appPosName, qualCrossData);
                    usesTableDisplay = true;
                } else {
                    finalHTML = `🎉 <strong>Qualified!</strong><br>You meet all requirements for the position you are applying for.`;
                }
            } else {
                finalHTML = buildQualTable(appPosName, userScores, requirements[appPosName], true);
                usesTableDisplay = true;
            }
            color = "var(--text-green)";
        } else {
            color = "#ffcccc";

            if (result.type === 'regulatory') {
                let formattedMessages = result.messages.map(m => `<li>${m}</li>`).join('');
                finalHTML = `<strong>Not Qualified for ${appPosName}</strong>:<br><ul style="text-align:left; margin-top:5px; margin-bottom:15px;">${formattedMessages}</ul>`;
            } else if (result.type === 'requirements_same') {
                finalHTML = buildQualTable(appPosName, userScores, requirements[appPosName], false);
                usesTableDisplay = true;
            } else {
                finalHTML = buildCrossStageQualTable(appPosName, result.crossData);
                usesTableDisplay = true;
            }

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

        // Display Requirements for Applied Position
        const appliedReqs = requirements[appPosName];
        if (appliedReqs) {
            if (reqCoiO) reqCoiO.textContent = appliedReqs.coi_o;
            if (reqCoiVs) reqCoiVs.textContent = appliedReqs.coi_vs;
            if (reqNcoiO) reqNcoiO.textContent = appliedReqs.ncoi_o;
            if (reqNcoiVs) reqNcoiVs.textContent = appliedReqs.ncoi_vs;
        }

        remarksText.innerHTML = finalHTML;
        remarksText.style.color = usesTableDisplay ? '' : color;

        resultContainer.classList.remove('hidden');
        showResultBtn.style.display = 'none';
        modifyBtn.classList.remove('hidden');
        if (printBtn) printBtn.classList.remove('hidden');
        resultContainer.scrollIntoView({ behavior: 'smooth' });
    }
});
