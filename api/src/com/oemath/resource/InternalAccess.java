package com.oemath.resource;

import java.util.ArrayList;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

@Path("internal")
public class InternalAccess {
	
    @GET
    @Produces(MediaType.TEXT_PLAIN)
    public Response getProblem(
            @Context HttpServletRequest request, 
            @QueryParam("grade") int grade,
            @QueryParam("pid") int pid,
            @QueryParam("action") String action) {

        int retStatus = 500;
        String retString = "Error";
        
        try {
            JSONObject problem = new JSONObject();
            Prob prob = Database.getNextProbFromGradePid(grade, pid, action);
            if (prob != null) {
	            problem.put("count", 1);
	            problem.put("pid", prob.pid);
	            problem.put("problem", prob.problem);
	            problem.put("param", prob.param);
	            problem.put("type", prob.type);
	            problem.put("answer", prob.answer);
	
	            if (!Utils.isEmpty(prob.hintList)) {
	                List<JSONObject> hintList = new ArrayList<JSONObject>();
	                for (Hint hint : prob.hintList) {
	                    JSONObject hintObj = new JSONObject();
	                    hintObj.put("hid", hint.hid);
	                    hintObj.put("desc", hint.desc);
	                    hintList.add(hintObj);
	                }
	                problem.put("hint", hintList);
	            }
	            retStatus = 200;
	            retString = problem.toString();
            }
        }
        catch (JSONException je) {
            
        }

        return Response
                .status(retStatus)
                .entity(retString)
                .build();
    }

}
