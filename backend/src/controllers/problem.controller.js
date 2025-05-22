import { db } from "../lib/db.js"
import { pollBatchResults, submitBatch } from "../lib/judge0.lib.js"



export const createProblem= async (req,res)=>{
    // get all the data from request body
    const {title,description, difficulty, tags, examples, constraints, testcases, codeSnippets, referenceSolutions}= req.body
   
    // check userRole again
    if(req.user.role!== 'ADMIN'){
        return res.status(403).json({error: "You are not allowed to create problem"})
    }
    // loop through each refrence solution for different languages.
    try {
        for (const [language, solutionCode] of Object.entries(referenceSolutions)) {
            const languageId = getJudge0LanguageId(language)
        
            if(!languageId){
                return res.status(400).json({
                    error:`language: ${language} is not supported `
                })
            }
            
            const submissions= testcases.map(({ input,output })=>({
                source_code: solutionCode,
                language_id: languageId,
                stdin:input,
                expected_output:output,
            }))

            const submissionResults = await submitBatch(submissions)

            const tokens = submissionResults.map((res)=>res.token)

            const results = await pollBatchResults(tokens)

            for(let i=0; i<results.length; i++){
                const result = results[i]
                if(result.status.id !== 3){  // 3 means success
                    return res.status(400).json({
                        error: `Test case ${i+1} failed for language ${language}`
                    })
                }
            }
            // save the problem to the database
            const newProblem= await db.problem.create({
                data:{
                    title,
                    description,
                    difficulty,
                    tags,
                    examples,
                    constraints,
                    testcases,
                    codeSnippets,
                    referenceSolutions,
                    userId:req.user.id
                }
            })

            return res.status(201).json({
                sucess: true,
                message: "Message Created Successfully",
                problem: newProblem,
            })
        }

    } catch (error) {
         console.log(error);
        return res.status(500).json({
        error: "Error While Creating Problem",
        });
    }
}

export const getAllProblems=()=>{}

export const getProblemById=()=>{}

export const updateProblem=()=>{}

export const getAllProblemsSolvedByUser=()=>{}

export const deleteProblem=()=>{}