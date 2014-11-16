package com.oemath.resource;

import java.util.ArrayList;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import javax.ws.rs.FormParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

@Path("/problem")
public class Problem {

    @POST
    @Produces(MediaType.TEXT_PLAIN)
    public Response getProblem(
            @Context HttpServletRequest request, 
            @FormParam("grade") String gradeStr,
            @FormParam("index") String indexStr) {
        
//        User user = UserManagement.lookupUser(request);
        
        int retStatus = 500;
        String retString = "Error";
        
        try {
            int grade = Integer.parseInt(gradeStr);
            int index = Integer.parseInt(indexStr);

            HttpSession session = request.getSession(true);
            @SuppressWarnings("unchecked")
            ArrayList<Integer> pidsList = (ArrayList<Integer>)session.getAttribute(Session.SESSION_ATTRIBUTE_PRACTICE_PIDS);

            JSONObject problem = new JSONObject();
            if (!Utils.isEmpty(pidsList) &&  index < pidsList.size()) {
                Prob prob = Database.getProbFromGradePid(grade,  pidsList.get(index));

                problem.put("count", 1);
                problem.put("pid", prob.pid);
                problem.put("problem", prob.problem);
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
            else {
                problem.put("count", 0);
            }
        }
        catch (NumberFormatException nfe) {
            
        }
        catch (JSONException je) {
            
        }

        return Response
                .status(retStatus)
                .entity(retString)
                .build();
    }
    
}
