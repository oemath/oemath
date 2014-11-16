package com.oemath.resource;

import java.io.UnsupportedEncodingException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.SQLException;
import java.util.UUID;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.NewCookie;
import javax.ws.rs.core.Response;

import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

@Path("/user")
public class UserManagement {

    final static int USER_NOT_SIGNED_IN = 0;
    final static int USER_SIGNED_IN_FULLY = 1;
    final static int USER_SIGNED_IN_REMEMBERED = 2;
    final static int USER_PAID = 8;

    
    final static String COOKIE_USERNAME = "username";
    final static String COOKIE_TOKEN = "token";
    final static String COOKIE_REMEMBER = "remember";
    
    
    final static int REMEMBER_SQL_ERROR = -1;
    final static int REMEMBER_VALID = 0;
    final static int REMEMBER_EXPIRED = 1;
    final static int REMEMBER_INVALID = 2;
    
    
    final static int COOKIE_LIFESPAN = 365 * 86400;
    
    
    @GET
    @Path("/status")
    @Produces(MediaType.TEXT_PLAIN)
    public String getStatus(@Context HttpServletRequest request) {
        User user = lookupUser(request);
        
        if (user != null) {
            request.getSession(true).setAttribute(Session.SESSION_ATTRIBUTE_USER, user);
            return user.userName;
        }
        else {
            return "";
        }
    }

    
    @POST
    @Produces(MediaType.TEXT_PLAIN)
    @Path("/login")
    public Response loginUser(
            @Context HttpServletRequest request, 
            @FormParam("username") String userName, 
            @FormParam("password") String password) {

        String retString = "";
        int retStatus = 500;
        User user = null;
        boolean success = false;
        
        if (userName==null || userName.isEmpty()) {
            retString = "User name is null or empty";
        }
        else if (password==null || password.isEmpty()) {
            retString = "Password is empty";
        }
        else {
            user = Database.lookupByUsernameOrEmail(userName);
            
            JSONObject obj = new JSONObject();
            if (user != null) {
                userName = user.userName;
                success = shaPassword(password, user.salt).equals(user.password);
            }
            
            try {
                obj.put("result", success ? "Success:"+userName : "Invalid username or password!");
                retString = obj.toString();
            }
            catch (JSONException jex) {
                retString = jex.toString();
            }

            retStatus = 200;
        }
        
        if (success) {
            HttpSession session = request.getSession(false);
            if (session != null) {
                session.invalidate();
            }
            session = request.getSession(true);
            String token = getSalt();
            user.token = token;
            session.setAttribute(Session.SESSION_ATTRIBUTE_USER, user);


            // save remember_me token in database in server side.
            Database.updateUserToken(userName, token);

            // remember_me cookie in client.
            Response response = Response.status(retStatus)
                    .entity(retString)
                    .cookie(new NewCookie(COOKIE_USERNAME, userName, "/", null, null, COOKIE_LIFESPAN, false))
                    .cookie(new NewCookie(COOKIE_TOKEN, token, "/", null, null, COOKIE_LIFESPAN, false))
                    .cookie(new NewCookie(COOKIE_REMEMBER, "true", "/", null, null, COOKIE_LIFESPAN, false))
                    .header("Access-Control-Allow-Origin", "http://"+request.getServerName()+":8080")
                    .header("Access-Control-Allow-Credentials", "true")
                    .header("Access-Control-Allow-Methods", "POST")
//                    .header("Access-Control-Allow-Headers", "Overwrite, Destination, Content-Type, Depth, User-Agent, X-File-Size, X-Requested-With, If-Modified-Since, X-File-Name, Cache-Control")
                    .build();

            return response;
        }
        else {
            Response response = Response.status(retStatus)
                    .entity(retString)
                    .header("Access-Control-Allow-Origin", "http://"+request.getServerName()+":8080")
                    .header("Access-Control-Allow-Credentials", "true")
                    .header("Access-Control-Allow-Methods", "POST")
                    .build();

            return response;
        }

    }
    

    @POST
    @Path("/register")
    @Produces(MediaType.TEXT_PLAIN)
    public Response createUser(
            @FormParam("username") String userName, 
            @FormParam("email") String email,
            @FormParam("password") String password) {

        String retString = "";
        int retStatus = 500;
        
        if (userName==null || userName.isEmpty()) {
            retString = "User name is null or empty";
        }
        else if (password==null || password.isEmpty()) {
            retString = "Password is empty";
        }
        else if (email==null || email.isEmpty()) {
            retString = "Password is empty";
        }
        else {
            String result = createUser(userName, null, "", "", email, password);
            JSONObject obj = new JSONObject();
            try {
                obj.put("result", result.isEmpty() ? "Success" : result);
                retString = obj.toString();
                retStatus = 200;
            }
            catch (JSONException je) {
                retString = je.toString();
            }
        }
        
        return Response.status(retStatus).entity(retString).
                header("Access-Control-Allow-Origin", "http://localhost:8080").
                header("Access-Control-Allow-Credentials", "true").build();
    }

    @POST
    @Produces(MediaType.TEXT_PLAIN)
    @Path("/logout")
    public Response logoutUser(
            @Context HttpServletRequest request) {

        User user = null;

        HttpSession session = request.getSession(false);
        if (session != null) {
            user = (User)session.getAttribute(Session.SESSION_ATTRIBUTE_USER);
            session.invalidate();
        }

        String userName = null;
        String token = null;

        if (user != null) {
            userName = user.userName;
            token = user.token;
        }
        else {
            // session timed out, so let's check cookie 
            javax.servlet.http.Cookie[] cookies = request.getCookies();
            if (cookies != null) {
                for (javax.servlet.http.Cookie cookie : cookies) {
                    if (cookie.getName().equals(COOKIE_USERNAME)) {
                        userName = cookie.getValue();
                    }
                    else if (cookie.getName().equals(COOKIE_TOKEN)) {
                        token = cookie.getValue();
                    }
                }
            }
        }
        
        if (userName != null && !userName.isEmpty() && token != null && !token.isEmpty()) {
            Database.clearTokenByUsernameAndToken(userName, token);
        }
        
        Response response = Response.status(200)
                .entity("Success")
                .cookie(new NewCookie(COOKIE_USERNAME, "", "/", null, null, 0, false))
                .cookie(new NewCookie(COOKIE_TOKEN, "", "/", null, null, 0, false))
                .build();

        return response;
    }
    
    
    // return null if session expired and userName/token combination in cookie, if existing,
    // cannot be found in table user.
    // This prevents a user logging on multiple browsers/machines.
    // But cannot prevent session being hijacked.
    public static User lookupUser(HttpServletRequest request) {
        HttpSession session = request.getSession(true);
        session.setMaxInactiveInterval(500); // session time out in 1 hour
        
        User user = (User)session.getAttribute(Session.SESSION_ATTRIBUTE_USER);
        if (user != null) {
            return user;
        }
        
        // session timed out, so let's check cookie 
        String userName = null;
        String token = null;
        javax.servlet.http.Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (javax.servlet.http.Cookie cookie : cookies) {
                if (cookie.getName().equals(COOKIE_USERNAME)) {
                    userName = cookie.getValue();
                }
                else if (cookie.getName().equals(COOKIE_TOKEN)) {
                    token = cookie.getValue();
                }
            }
        }
        
        if (userName == null || userName.isEmpty() || token == null || token.isEmpty()) {
            return null;
        }

        user = Database.lookupByUsernameAndToken(userName, token);
        
        return user;
    }
    

    private static String getSalt() {
        return UUID.randomUUID().toString().replace("-", "");
    }
    
    
    private static String shaPassword(String password, String salt) {
        String passwordSha256 = "";
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] mdbytes = digest.digest((password + salt).getBytes("UTF-8"));
            
            StringBuffer hexString = new StringBuffer();
            for (int i=0;i<mdbytes.length;i++) {
              hexString.append(Integer.toHexString(0xFF & mdbytes[i]));
            }
            passwordSha256 = hexString.toString().toLowerCase();
        }
        catch (NoSuchAlgorithmException nsae) {
            return nsae.toString();
        }
        catch (UnsupportedEncodingException uee) {
            return uee.toString();
        }
        
        return passwordSha256;
    }


    public static String createUser(
            String userName,
            byte[] picture,
            String firstName,
            String lastName,
            String email,
            String password) {
        
        try {
            if (Database.isExistingUser(userName)) {
                return "User existed";
            }
        }
        catch (SQLException se) {
            return se.toString();
        }

        try {
            if (Database.isExistingEmail(email)) {
                return "Email existed";
            }
        }
        catch (SQLException se) {
            return se.toString();
        }

        String salt = getSalt();
        String passwordSha256 = shaPassword(password, salt);
        if (passwordSha256 == null) {
            return "hash password failed";
        }
        
        User user = new User();
        user.userName = userName;
        user.firstName = firstName;
        user.lastName = lastName;
        user.email = email;
        user.picture = picture;
        user.salt = salt;
        user.password = passwordSha256;
        return Database.createUser(user);
    }
}
