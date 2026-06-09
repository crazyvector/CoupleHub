package io.couplehub.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class CalendarWidget extends AppWidgetProvider {

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_calendar);

        SharedPreferences prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
        String eventsJson = prefs.getString("widget_events", "[]");

        StringBuilder eventText = new StringBuilder();
        try {
            JSONArray arr = new JSONArray(eventsJson);
            int count = 0;
            long now = System.currentTimeMillis();
            SimpleDateFormat sdf = new SimpleDateFormat("dd MMM", new Locale("ro", "RO"));

            for (int i = 0; i < arr.length(); i++) {
                JSONObject event = arr.getJSONObject(i);
                String dateStr = event.optString("date", "");
                if (dateStr.isEmpty()) continue;

                // Simple check if date is in the future
                // JS sends yyyy-mm-dd
                eventText.append("📅 ").append(dateStr).append(" - ").append(event.getString("name")).append("\n");
                count++;
                if (count >= 4) break;
            }
            if (count == 0) {
                eventText.append("Niciun eveniment apropiat!");
            }
        } catch (Exception e) {
            eventText.append("Eroare la încărcare.");
        }

        views.setTextViewText(R.id.appwidget_text, eventText.toString());

        Intent intent = new Intent(Intent.ACTION_VIEW, android.net.Uri.parse("couplehub://app/calendar"));
        intent.setPackage(context.getPackageName());
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_container, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }
}
